
export default class EventBus {
  _handlers = {};

  on(method, handler, index) {
    if (this._handlers[method]) {
      if (typeof index === 'number' && isFinite(index)) {
        this._handlers[method].splice(index, 0, handler);
      } else {
        this._handlers[method].push(handler);
      }
    } else {
      this._handlers[method] = [handler];
    }
  }

  addEventListener(method, handler) {
    this.on(method, handler);
  }

  removeEventListener(method, handler) {
    this.off(method, handler);
  }

  once(method, handler) {
    let called = false;
    const fn = (...args) => {
      this.off(method, fn);
      if (!called) {
        called = true;
        handler.call(this, ...args);
      }
      this.on(method, fn);
    }
  }

  off(method, handler) {
    if (!method) {
      return;
    }
    if (!Array.isArray(this._handlers[method])) {
      return;
    }
    if (handler) {
      let index = this._handlers[method].findIndex(h => h === handler);
      if (index > -1) {
        this._handlers[method].splice(index, 1);
      }
    } else {
      this._handlers[method] = [];
    }
  }

  emit(method, ...args) {
    if (!method) {
      return;
    }
    if (!Array.isArray(this._handlers[method])) {
      return;
    }
    const handlers = this._handlers[method];
    handlers.forEach(h => h.call(this, ...args));
  }
  
}