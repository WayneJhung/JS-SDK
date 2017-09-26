// import Backendless from '../bundle'
// import Utils from '../utils'
// import Async from '../request/async'
// import PollingProxy from './polling-proxy'
// // import SocketProxy from './socket-proxy'
//
// export default class Subscription {
//
//   constructor(config) {
//     this.channelName = config.channelName
//     this.options = config.options
//     this.channelProperties = config.channelProperties
//     this.subscriptionId = null
//     this.restUrl = config.restUrl + '/' + config.channelName
//     this.responder = config.responder || Utils.emptyFn
//     this._subscribe(config.onSubscribe)
//   }
//
//   _subscribe(/** async */) {
//     const responder = Utils.extractResponder(arguments)
//     const isAsync = !!responder
//     const self = this
//
//     const _async = new Async(function(data) {
//       self.subscriptionId = data.subscriptionId
//       self._startSubscription()
//     }, function(e) {
//       responder.fault(e)
//     })
//
//     const subscription = Backendless._ajax({
//       method      : 'POST',
//       url         : this.restUrl + '/subscribe',
//       isAsync     : isAsync,
//       data        : JSON.stringify(this.options),
//       asyncHandler: _async
//     })
//
//     if (!isAsync) {
//       this.subscriptionId = subscription.subscriptionId
//       this._startSubscription()
//     }
//   }
//
//   _startSubscription() {
//     if (WebSocket) {
//       this.rtClientConnected = true
//
//       Backendless.RTClient.MESSAGING.onMessage(this.channelName, this.options, this.responder)
//       // const url = this.channelProperties['websocket'] + '/' + this.subscriptionId
//       // this.proxy = new SocketProxy(url)
//       //
//       // this.proxy.on('socketClose', () => {
//       //   this._switchToPolling()
//       // })
//       //
//       // this.proxy.on('messageReceived', () => {
//       //   this.responder()
//       // })
//     } else {
//       this._switchToPolling()
//     }
//
//     this._startSubscription = Utils.emptyFn
//   }
//
//   cancelSubscription() {
//     if (this.rtClientConnected) {
//       Backendless.RTClient.MESSAGING.offMessage(this.channelName, this.options, this.responder)
//     }
//
//     this.proxy && this.proxy.close()
//     this._startSubscription = Utils.emptyFn
//   }
//
//   _switchToPolling() {
//     const url = this.restUrl + '/' + this.subscriptionId
//     this.proxy = new PollingProxy(url)
//     const self = this
//
//     this.proxy.on('messageReceived', function(data) {
//       if (data.messages.length) {
//         self.responder(data)
//       }
//     })
//   }
// }