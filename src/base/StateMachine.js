import EventBus from './EventBus';

const INIT_STATE = '_init';
const DESTROY = 'destroy';

const _stateMachines = [];
window.$StateMachines$ = {};

function upperFirstCase(state) {
  return state.charAt(0)
    .toUpperCase() + state.slice(1);
}



export default class StateMachine extends EventBus {
  _stateMachineName = name;
  currentState = INIT_STATE;
  stateStack = '';
  _breakPoint = [];
  _parentStateMachine = parent;
  _timeoutMonitor = [];
  _tickerStamp = Date.now();
  _destroyed = false;
  _dependents = [];
  _fireMap = {};
  _delayTimer = null;

  constructor(name, parent) {
    super();
    this._stateMachineName = name;
    this._parentStateMachine = parent;
    window.$StateMachines$[name] = this;
    _stateMachines.push(this);
  }

  nextState(state, ...args) {
    if (this.currentState === state || this.currentState === DESTROY) {
      return;
    }
    clearTimeout(this._delayTimer);
    let now = Date.now();
    this.stateStack += `${this.currentState}@${now - this._tickerStamp}`;
    let prevState = this.currentState;
    if (this._fireMap[prevState] && !this._fireMap[prevState].fired) {
      this.emit(prevState, ...this._fireMap[prevState].args);
      this.emit(`__sync__.${prevState}`, ...this._fireMap[prevState].args);
      this._fireMap[prevState].fired = true;
    }
    this.currentState = state;
    this.log(prevState, state, args);
    this._checkTimeout(prevState, state);
    this._tickerStamp = now;

    const onMethodName = `on${upperFirstCase(state)}`;
    const afterMethodName = `after${upperFirstCase(state)}`;
    if (typeof this[onMethodName] === 'function') {
      this[onMethodName].call(this, ...args);
    }
    if (!this._fireMap[state].fired) {
      this.emit(state, ...args);
      this.emit(`__sync__.${state}`, ...args);
    }
    delete this._fireMap[state];
    if (typeof this[afterMethodName] === 'function') {
      this[afterMethodName].call(this, ...args);
    }

    if (this._destroyed) {
      this._destroyed();
    } else {
      this._resolveDependents();
    }
  }

  // 当状态机 同时满足进入过 sourceReady playListLoaded 两种状态时 则进入mediaReady状态
  // 此方法实现多个异步事件同步
  // this.nextStateAfter('sourceReady+playListLoaded', 'mediaReady');

  nextStateAfter(dependentState, state, ...args) {
    let strictMode = dependentState.indexOf('|') >= 0;
    let combinedMode = dependentState.indexOf('+') >= 0;
    if (!strictMode && !combinedMode) {
      strictMode = true;
    } else if (strictMode && combinedMode) {
      throw new SyntaxError('StateMachine.nextStateAfter不支持|+同时出现');
    }
    let criteria;
    if (strictMode) {
      criteria = new RegExp(`^(${dependentState.split('|')
        .filter(e => e)
        .join('|')})$`);
    } else if (combinedMode) {
      criteria = dependentState.split('+')
        .map(text => new RegExp(`\\b${text}\\b`));
    }
    this._dependents.push({
      criteria,
      state,
      args,
    });
    this._resolveDependents();
  }

  _resolveDependents() {
    for (let i = 0; i < this._dependents.length; i++) {
      let dep = this._dependents[i];
      let states = `${this.stateStack};${this.currentState}`;
      let hit = false;
      if (dep.criteria instanceof RegExp) {
        hit = dep.criteria.test(this.currentState);
      } else if (dep.criteria instanceof Array) {
        hit = dep.criteria.every(r => r.test(states));
      }
      if (hit) {
        setTimeout(() => {
          this.nextState(dep.state, ...dep.args);
        });
        this._dependents.splice(i, 1);
        break;
      }
    }
  }

  nextStateBy(target, event, state, ...args) {
    let _checkState = null;
    let _currentState = this.currentState;
    let handler = (data) => {
      let _args = [data].concat(args);
      if (!_checkState || this.isInState(_checkState)) {
        if (typeof state === 'function') {
          state(...args);
        } else {
          this.nextState(state, ..._args);
        }
      }
    }
    target.on(event, handler);
    return {
      check(checkState) {
        _checkState = checkState? checkState: _currentState;
        return this;
      },
      off() {
        target.off(event, handler);
      }
    }

  }

  nextStateByOnce(target, event, state, ...args) {
    let _checkState = null;
    let _currentState = this.currentState;
    const handler = (data) => {
      let _args = [data].concat(args);
      if (!_checkState || this.isInState(_checkState)) {
        if (typeof state === 'function') {
          state(...args);
        } else {
          this.nextState(state, ..._args);
        }
      }
    }
    target.once(event, handler);
    return {
      check(checkState) {
        _checkState = checkState? checkState: _currentState;
        return this;
      }
    }
  }

  nextStateWhen(promise, state, ...args) {
    if (!promise) {
      return { check(){return this}};
    }
    promise.then(data => {
      let _args = [data].concat(args);
      if (!_checkState || this.isInState(_checkState)) {
        if (typeof state === 'function') {
          state(...args);
        } else {
          this.nextState(state, ..._args);
        }
      }
    })

    return {
      check(checkState) {
        _checkState = checkState === undefined ? _currentState : checkState;
        return this;
      },
    }

  }

  hasState(state) {
    return new RegExp(`\\b${state}\\b`).test(this.stateStack);
  }

  isInState(states) {
    if (states.indexOf(',') == -1) {
      return this.currentState === states;
    } else {
      const reg = new RegExp(`^(${states.replace(/,/g, '|')})$`);
      return reg.test(this.currentState);
    }
  }


  /*
  MediaController -> onMediaReady()
  this.syncState(this.mediaBuffer, 'idle', 'segmentLoaded');
  this.syncState(this.mediaBuffer, 'initMp4Appended', 'initMp4Appended');
  this.syncState(this.mediaBuffer, 'error', 'error');
  */

  syncState(target, targetState, thisState = targetState) {
    target.on(`__sync__.${targetState}`, (...args) => {
      this.nextState(thisState, ...args);
    });
  }


  log(prevState, state, args) {

  }

  _checkTimeout(prevState, state) {

  }







}