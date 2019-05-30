



export default class DataService {

  onProgress = () => {};
  config = null;

  constructor(onProgress) {
    this.onProgress = onProgress;

  }

  requestSegment(url, segment) {

    

  }




}

DataService.RequestType = {
  PLAY_LIST: 0,
  SEGMENT: 1,
  LICENSE: 2,
};