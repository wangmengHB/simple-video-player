import EventBus from './base/EventBus';



export default class VideoManager extends EventBus {
  dataPipeLine = null;
  mediaMonitor = null;
  downloadMonitor = null;
  dataService = null;
  detector = null;
  config = null;
  videoElement = null;


  constructor(options) {
    super();
    
    this.dataPipeLine = new DataPipeLine();
    this.mediaMonitor = new MediaMonitor();
    this.downloadMonitor = new DownloadMonitor();
    this.mediaMonitor.mountDownload(this.downloadMonitor);
    this.dataService = new DataService(options, (...args) => {
      this.downloadMonitor.onRequestProgress(...args);
    });

  }

  attachMedia(ele) {
    this.videoElement = ele;
    this.init();
  }

  init() {
    this.mediaController = new MediaController(this.videoElement, this);
    this.mediaMonitor.mountEle(this.videoElement);
    this.mediaDriver = new MediaDriver(this.videoElement, this.mediaController, this);
  }

  loadSource(url) {
    if (/^\s*#EXTM3U/.test(url)) {
      this.mediaDriver.loadPlayList({ source: url });
    } else if (typeof url === 'string') {
      this.mediaDriver.loadPlayList({ url });
    } else if (Array.isArray(url)) {
      this.mediaDriver.loadPlayList(url.map(e => (typeof e === 'string' ? { url: e } : e)));
    }
    this.url = undefined;
  }


}