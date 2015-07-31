angular.module( 'chunked-audio', [])
.factory( 'ChunkPlayer', [ '$rootScope', function( $rootScope) {
  return function( options, callback ) {

    var self = this;

    if( typeof( options ) == 'string' ) {
      options = { id: options };
    };

    if( options.duration ) {
      this.duration = options.duration;
    };

    this.id = options.id;

    if( $rootScope.players[ this.id ] ) {
      throw 'Player exists';
    };

    options.unique = options.unique || true;
    if( options.unique ) {
      for( k in $rootScope.players ) {

        var p = $rootScope.players[k];
        p.player.pause();
        angular.element(p.player).remove();
        delete( $rootScope.players[k] );

      };
    };

    this.mediaSource = new MediaSource();
    this.source = null
    this.stream = null;

    this.player = angular.element( '<audio></audio>' ),
    body = angular.element(document).find('body').eq(0);

    this.player.attr( 'data-id', this.id );

    body.append(this.player);


    this.player[0].src = window.URL.createObjectURL( this.mediaSource );
    this.player.bind( 'timeupdate', function() {
      if( self.stream.duration ) {
        if( this.currentTime >= self.stream.duration ) { 
          self.player.triggerHandler( { type: 'ended' } );
        };
      };
    });

    this.player.bind( 'ended', function() {
    });

    this.source = $rootScope.audioContext.createMediaElementSource( this.player[0] );
    this.source.connect( $rootScope.audioContext.destination );

    this.mediaSource.addEventListener( 'sourceopen', function() {
      self.stream = {
        mediaSource: self.mediaSource,
        player: self.player[0],
        sourceBuffer: self.mediaSource.addSourceBuffer( 'audio/mpeg' ),
        loadedBuffers: [],
        appendedItems: 0,
        duration: -1,
        append: function( chunk, callback ) {

          this.loadedBuffers.push( chunk );
          if( !this.sourceBuffer.updating ) {
            this.sourceBuffer.appendBuffer( this.loadedBuffers.shift() );
            this.appendedItems++;
          };
          if( callback ) {
            callback( this.appendedItems, this );
          } else {
            return this.appendedItems;
          };
        },
        play: function() {
          this.player.play();
        },
        decodeBase64: function (base64) {
          var binary_string =  window.atob(base64),
              len = binary_string.length,
              bytes = new Uint8Array( len );
              for (var i = 0; i < len; i++) {
                bytes[i] = binary_string.charCodeAt(i);
              };
              return bytes.buffer;
        }
      };

      $rootScope.players[ self.id ] = self.stream;
      if( callback ) {
        callback( self.stream, self.stream.player );
      };
    });
  };
}])

.service( 'ChunkedAudio', [ '$rootScope', 'ChunkPlayer', function( $rootScope, ChunkPlayer ) {
  function load( options, callback ) {
    var player = new ChunkPlayer( options, callback );
  };
  return {
    load: load
  };
}])

.run( function( $rootScope ) {
  $rootScope.players = {};
  $rootScope.audioContext = new AudioContext();
});
