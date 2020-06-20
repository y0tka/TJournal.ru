/**
 * -----------------------------------------
 *  ____  _           _          _    _
 * |  _ \(_) ___ ___ | |__   ___| |  (_)___
 * | |_) | |/ __/ _ \| '_ \ / _ \ |  | / __|
 * |  __/| | (_| (_) | |_) |  __/ |_ | \__ \
 * |_|   |_|\___\___/|_.__/ \___|_(_)| |___/
 * Picobel.js                       _/ |
 * tomhazledine.com/audio          |__/
 *
 * =========================================
 *
 * Replace any native <audio> instances with
 * standard elements (spans, buttons & divs)
 * that we can style however we like.
 *
 * Functionality powered by Web Audio API.
 * -----------------------------------------
 */
function Picobel( options ) {

  /**
   * -----------------------
   * PARSE OPTIONS
   *
   * Make sure we have valid
   * options. If we don't we
   * should provide sensible
   * fallbacks.
   * -----------------------
   */
  options = typeof options !== 'undefined' ? options : {};
  // options.prefix = options.prefix || '';
  options.theme = options.theme || 'defaultPlayerTheme';

  /**
   * ---------------------------------------------
   * MAKE STUFF HAPPEN
   *
   * The following lines initialize functions we
   * declare further down the file. We need to
   * call them in a specific order (so things like
   * element-selection work properly).
   * ---------------------------------------------
   */

    // Find all the elements and store them
    // in an array (for easy access).
  var audioElements = findAudio();

  // Get our data from those elements.
  var data = getRawData( audioElements );

  // Replace those elements with our own custom markup.
  buildMarkup( audioElements );

  // Now we've placed our elements in the DOM, we can select them.
  var wrappers = document.getElementsByClassName( 'customAudioPlayer' );
  var rewindButtons = document.getElementsByClassName( 'playerRewind' );
  var playPauseButtons = document.getElementsByClassName( 'playerTrigger' );
  var fwdButtons = document.getElementsByClassName( 'playerFwd' );
  var muteButtons = document.getElementsByClassName( 'songMuteButton' );
  var playPauseButtonsText = document.getElementsByClassName( 'buttonText' );
  var playTimer = document.getElementsByClassName( 'songPlayTimer' );
  var songLengthBox = document.getElementsByClassName( 'songDuration' );
  var titleDisplay = document.getElementsByClassName( 'titleDisplay' );
  var artistDisplay = document.getElementsByClassName( 'artistDisplay' );
  var progressBar = document.getElementsByClassName( 'songProgressSlider' );
  var pseudoProgressBar = document.getElementsByClassName( 'pseudoProgressBackground' );
  var playhead = document.getElementsByClassName( 'pseudoProgressPlayhead' );
  var indicator = document.getElementsByClassName( 'pseudoProgressIndicator' );
  var volumeControl = document.getElementsByClassName( 'songVolumeSlider' );
  var volumePseudoBackground = document.getElementsByClassName( 'pseudoVolumeBackground' );
  var volumeDisplay = document.getElementsByClassName( 'songVolumeValue' );
  var volumeIndicator = document.getElementsByClassName( 'pseudoVolumeIndicator' );
  var volumePlayhead = document.getElementsByClassName( 'pseudoVolumePlayhead' );
  var timeIndicators = document.getElementsByClassName( 'timeIndicator' );

  // Initialize the audio.
  var myAudio = initAudio( data );

  // Create a var to store the index of the file currently
  // being played (defaulting to the first track in the DOM)
  var currentSongIndex = 0;

  /**
   * ---------------------------------
   * SETUP
   *
   * These functions find our targets,
   * generate our elements, and set up
   * our environment.
   * ---------------------------------
   */

  // Return an array of all the <audio> elements found on the page.
  function findAudio() {
    // Get all the <audio> occurrences in the page.
    var audioElements = document.getElementsByTagName( 'audio' );
    // Save our audioElements as an array (so
    // we can manipulate the DOM but still
    // access our items).
    var items = [].slice.call( audioElements );
    return items;
  }

  // Get the url for each audio file
  // we want to load [using elements
  // found by findAudio()]
  function getRawData( data ) {
    var output = [];
    for ( var i = 0; i < data.length; i++ ) {
      var item = {};
      // Get the file's URL
      item.url = data[i].src;
      item.dur = parseFloat(data[i].getAttribute('data-duration'));
      output.push( item );
    }
    return output;
  }

  // Create our own markup in place of the native <audio> elements.
  function buildMarkup( data ) {
    for ( var i = 0; i < data.length; i++ ) {

      // Create a container for our new player
      var newPlayer = document.createElement( 'div' );
      newPlayer.className = 'customAudioPlayer initial player_' + i;
      // If the element has a valid class, add that to the player's wrapper
      var className = audioElements[i].className;
      if ( className !== '' ) {
        _addClass( newPlayer, className );
      }
      // Add the class set in our options.
      _addClass( newPlayer, options.theme );
      newPlayer.setAttribute( 'data-song-index', i );

      // Create a loading indicator
      var loading = document.createElement( 'div' );
      loading.className = 'loader';

      // Add "waiting" indicator here.

      // Create a play/pause button
      var button = document.createElement( 'button' );
      button.className = 'playerTrigger';
      var buttonText = document.createElement( 'span' );
      buttonText.className = 'buttonText';
      buttonText.innerHTML = 'play';
      button.appendChild( buttonText );

      var fwd = document.createElement( 'button' );
      fwd.className = 'playerFwd';
      var fwdText = document.createElement( 'span' );
      fwdText.className = 'buttonText';
      fwdText.innerHTML = 'forward';
      fwd.appendChild( fwdText );

      var rewind = document.createElement( 'button' );
      rewind.className = 'playerRewind';
      var rewindText = document.createElement( 'span' );
      rewindText.className = 'buttonText';
      rewindText.innerHTML = 'backward';
      rewind.appendChild( rewindText );

      // Create a wrapper for our player's metadata
      var meta = document.createElement( 'div' );
      meta.className = 'metaWrapper';

      // Create elements to display file metadata
      var meta_title = document.createElement( 'span' );
      meta_title.className = 'titleDisplay';
      meta_title.innerHTML = 'File ' + ( i + 1 );
      meta.appendChild( meta_title );

      var meta_artist = document.createElement( 'span' );
      meta_artist.className = 'artistDisplay';
      meta.appendChild( meta_artist );

      var timings = document.createElement( 'div' );
      timings.className = 'timingsWrapper';

      var meta_timer = document.createElement( 'span' );
      meta_timer.className = 'songPlayTimer';
      meta_timer.innerHTML = '0:00';
      timings.appendChild( meta_timer );

      // Progress Indicator
      var meta_pseudo_progress_background = document.createElement( 'div' );
      meta_pseudo_progress_background.className = 'pseudoProgressBackground';
      var meta_pseudo_progress_indicator = document.createElement( 'div' );
      meta_pseudo_progress_indicator.className = 'pseudoProgressIndicator';
      meta_pseudo_progress_background.appendChild( meta_pseudo_progress_indicator );
      var meta_pseudo_progress_playhead = document.createElement( 'div' );
      meta_pseudo_progress_playhead.className = 'pseudoProgressPlayhead';
      meta_pseudo_progress_background.appendChild( meta_pseudo_progress_playhead );
      var meta_progress = document.createElement( 'input' );
      meta_progress.type = 'range';
      meta_progress.min = 0;
      meta_progress.max = 100;
      meta_progress.value = 0;
      meta_progress.className = 'songProgressSlider';
      meta_pseudo_progress_background.appendChild( meta_progress );
      meta_pseudo_progress_background.appendChild( loading );

      var time_indicator = document.createElement('div');
      _addClass(time_indicator, 'timeIndicator')
      meta_pseudo_progress_background.appendChild( time_indicator );

      timings.appendChild( meta_pseudo_progress_background );

      var meta_duration = document.createElement( 'span' );
      meta_duration.className = 'songDuration';
      meta_duration.innerHTML = '-:--';
      timings.appendChild( meta_duration );

      // Volume Indicator
      var meta_volume = document.createElement( 'div' );
      meta_volume.className = 'songVolume';
      var meta_mute = document.createElement( 'button' );
      meta_mute.className = 'songMuteButton';
      var meta_mute_button_text = document.createElement('span');
      meta_mute_button_text.innerHTML = 'Mute';
      meta_mute_button_text.className = 'buttonText';
      meta_mute.appendChild(meta_mute_button_text);
      meta_volume.appendChild( meta_mute );
      var meta_volume_label_wrapper = document.createElement( 'div' );
      meta_volume_label_wrapper.className = 'songVolumeLabelWrapper';
      var meta_volume_label = document.createElement( 'span' );
      meta_volume_label.className = 'songVolumeLabel';
      meta_volume_label.innerHTML = 'Volume';
      meta_volume_label_wrapper.appendChild( meta_volume_label );
      var meta_volume_value = document.createElement( 'span' );
      meta_volume_value.className = 'songVolumeValue';
      meta_volume_value.innerHTML = '10';
      meta_volume_label_wrapper.appendChild( meta_volume_value );
      meta_volume.appendChild( meta_volume_label_wrapper );
      var meta_pseudo_volume_background = document.createElement( 'div' );
      meta_pseudo_volume_background.className = 'pseudoVolumeBackground';
      var meta_pseudo_volume_indicator = document.createElement( 'div' );
      meta_pseudo_volume_indicator.className = 'pseudoVolumeIndicator';
      meta_pseudo_volume_background.appendChild( meta_pseudo_volume_indicator );
      var meta_pseudo_volume_playhead = document.createElement( 'div' );
      meta_pseudo_volume_playhead.className = 'pseudoVolumePlayhead';
      meta_pseudo_volume_background.appendChild( meta_pseudo_volume_playhead );
      var meta_volume_control = document.createElement( 'input' );
      meta_volume_control.type = 'range';
      meta_volume_control.min = 0;
      meta_volume_control.max = 1;
      meta_volume_control.value = 1;
      meta_volume_control.step = 0.02;
      meta_volume_control.className = 'songVolumeSlider';
      meta_pseudo_volume_background.appendChild( meta_volume_control );
      meta_volume.appendChild( meta_pseudo_volume_background );

      // Add the button to the player
      newPlayer.appendChild( rewind );
      newPlayer.appendChild( button );
      newPlayer.appendChild( fwd );

      // Add the metadata to the player
      newPlayer.appendChild( meta );

      // Add the timings to the player
      newPlayer.appendChild( timings );

      // Add the volume display to the player
      newPlayer.appendChild( meta_volume );

      // Replace the original audio element with our new creation.
      data[i].parentNode.replaceChild( newPlayer, data[i] );

    }
  }


  // Initialize the audio for each file, and setup the event listeners.
  function initAudio( data ) {

    var myAudio = [];

    for ( var i = 0; i < data.length; i++ ) {
      // Init. the audio
      myAudio[i] = new Audio();
      myAudio[i].preload = 'none';
      // myAudio[i].src = data[i].url;
      // myAudio[i].currentTime = 0;

      // Setup event listeners
      rewindButtons[i].addEventListener( 'click', _rewindAudio, false );
      playPauseButtons[i].addEventListener( 'click', _playPauseAudio, false );
      fwdButtons[i].addEventListener( 'click', _fwdAudio, false );

      progressBar[i].addEventListener( 'input', sliderScrub, false );
      progressBar[i].dataset.width = progressBar[i].clientWidth;
      progressBar[i].dataset.songIndex = i;
      progressBar[i].addEventListener('mousemove', _showTime, false)
      pseudoProgressBar[i].addEventListener('touchstart', _progressBarTouched, true);

      volumeControl[i].addEventListener( 'input', volume, false );
      _addClass(muteButtons[i], 'highLevel');
      volumeIndicator[i].style.width = '100%';
      volumePlayhead[i].style.left = '100%';
      volumePseudoBackground[i].addEventListener('touchstart', _volumeTouched, true);


      myAudio[i].addEventListener( 'timeupdate', _triggerUpdateProgress, false );
      myAudio[i].addEventListener( 'loadstart', _loadStart, false );
      myAudio[i].addEventListener( 'canplaythrough', _canplaythrough, false );
      muteButtons[i].addEventListener( 'click', _muteUnmuteAudio, false );

      myAudio[i].addEventListener( 'error', _errors, false );
      myAudio[i].addEventListener( 'stalled', _stalled, false );
      myAudio[i].addEventListener( 'waiting', _errors, false );

      myAudio[i].addEventListener( 'progress', _progress, false );

      // Assign an index to each audio node:
      // this links the audio elements to the
      // relevant markup
      myAudio[i].setAttribute( 'data-song-index', i );

      songLengthBox[i].innerHTML = _secondsToMMSS(data[i].dur);
    }

    return myAudio;
  }

  function destroy() {

    for ( var i = 0; i < data.length; i++ ) {

      if (myAudio[i]) {
        myAudio[i].removeEventListener( 'timeupdate', _triggerUpdateProgress, false );
        myAudio[i].removeEventListener( 'loadstart', _loadStart, false );
        myAudio[i].removeEventListener( 'canplaythrough', _canplaythrough, false );
        myAudio[i].pause();
        myAudio[i].removeEventListener( 'error', _errors, false );
        myAudio[i].removeEventListener( 'stalled', _stalled, false );
        myAudio[i].removeEventListener( 'waiting', _errors, false );
        myAudio[i].removeEventListener( 'progress', _progress, false );
      }



      if (rewindButtons[i]){
        rewindButtons[i].removeEventListener( 'click', _rewindAudio, false );
      }

      if (playPauseButtons[i]){
        playPauseButtons[i].removeEventListener( 'click', _playPauseAudio, false );
      }

      if (fwdButtons[i]){
        fwdButtons[i].removeEventListener( 'click', _fwdAudio, false );
      }

      if (progressBar[i]){
        progressBar[i].removeEventListener( 'input', sliderScrub, false );
      }

      if (progressBar[i]){
        progressBar[i].removeEventListener('mousemove', _showTime, false);
      }

      if (volumeControl[i]){
        volumeControl[i].removeEventListener( 'input', volume, false );
      }

      if (muteButtons[i]){
        muteButtons[i].removeEventListener( 'click', _muteUnmuteAudio, false );
      }

      if (pseudoProgressBar[i]){
        pseudoProgressBar[i].removeEventListener('touchstart', _progressBarTouched, true);
      }

      if (volumePseudoBackground[i]){
        volumePseudoBackground[i].removeEventListener('touchstart', _volumeTouched, true);
      }

    }

    setTimeout(function() {

      data = null;
      audioElements = null;
      myAudio = null;
      currentSongIndex = 0;

    }, 100);
  }

  /**
   * -----------------------------
   * LOADING STATES
   *
   * Handle the buffering of audio
   * data and update displays to
   * show this.
   * -----------------------------
   */

  // Fire this event when loading starts [TEST]
  function _loadStart() {
    var index = this.getAttribute( 'data-song-index' );
    _addClass( wrappers[index], 'loading' );
    // console.log( 'Load start' );
  }

  // Fire this event when we can play the audio
  // all the way through (ie. it is fully loaded)
  function _canplaythrough() {
    var index = this.getAttribute( 'data-song-index' );
    _setLengthDisplay( index );
    _removeClass( wrappers[index], 'loading' );
    _removeClass( wrappers[index], 'initial' );

    _getMeta( index );
  }

  // Get info about the audio track, and update the display with this info
  function _getMeta( i ) {

    // Get the filename and type
    var url = myAudio[i].src;
    var fileType = _getFileType( url );
    var fileName = _getFileName( url );

    // If there is a valid title, display that title...
    var title = audioElements[i].title;
    if ( title !== '' ) {
      titleDisplay[i].innerHTML = title;
    } else {
      // ...otherwise show the file name.
      titleDisplay[i].innerHTML = fileName + '.' + fileType;
    }

    // If there is a valid 'artist', display the artist name.
    var artist = audioElements[i].getAttribute( 'data-artist' );
    if ( artist !== '' ) {
      artistDisplay[i].innerHTML = artist;
    }

    // // If the element has a valid class, add that to the player's wrapper
    // var className = audioElements[i].className;
    // if (className != '') {
    //     _addClass(wrappers[i], className)
    // }
  }

  /**
   * -----------------------
   * PLAYBACK SETTING
   *
   * These functions control
   * the functionality of
   * the audio players.
   * -----------------------
   */

  // Set all audio elements to 'paused'
  function pauseAll() {
    for ( var i = 0; i < data.length; i++ ) {
      myAudio[i].pause();
    }
  }

  // Play the selected song
  function playSong( index ) {
    currentSongIndex = index;

    if (!myAudio[currentSongIndex].src) {
        myAudio[currentSongIndex].src = data[currentSongIndex].url;
    }

    for ( var i = 0; i < data.length; i++ ) {
      if (i != index) {
        myAudio[i].pause();
      }
    }
    myAudio[index].play();
  }

  // Set the current position of selected song to specific value.
  function sliderScrub() {
    var value = this.value;
    var index = this.parentNode.parentNode.parentNode.getAttribute( 'data-song-index' );
    var duration = myAudio[index].duration;
    var targetTime = duration * ( value / 100 );
    targetTime = targetTime.toFixed( 2 );
    myAudio[index].currentTime = targetTime;
    _updateProgress( index );
  }

  function _progressBarTouched(e) {

    var index = this.parentNode.parentNode.getAttribute( 'data-song-index' );
    var size = this.getBoundingClientRect();

    var value = (e.targetTouches[0].clientX - size.left) / this.clientWidth;
    var duration = myAudio[index].duration;
    var targetTime = (duration * value).toFixed(2);

    myAudio[index].currentTime = targetTime;
    progressBar[index].value = value*100;

    _updateProgress(index);

  }

  // Volume
  function volume() {
    var value = this.value;
    var index = this.parentNode.parentNode.parentNode.getAttribute( 'data-song-index' );
    mute( index, false );
    setVolume( index, value );
  }

  function _volumeTouched(e) {

    var index = this.parentNode.parentNode.getAttribute( 'data-song-index' );
    var size = this.getBoundingClientRect();
    var value = ((e.targetTouches[0].clientX - size.left) / this.clientWidth).toFixed(1);

    volumeControl[index].value = value;

    mute(index, false);
    setVolume(index, value);

  }

  function setVolume( index, value ) {
    var valueMapped = value * 10;
    var volumePercent = value * 100;
    myAudio[index].volume = value;
    volumeDisplay[index].innerHTML = valueMapped;
    volumeControl[index].value = value;
    muteButtons[index].className = 'songMuteButton ' + (_hasClass(muteButtons[index], 'songMuted') ? 'songMuted' : 'songUnmuted');

    // var level;
    // switch (valueMapped) {
    //   case 0:
    //     level = 'songMuted';
    //     break;
    //   case 1:
    //   case 2:
    //   case 3:
    //   case 4:
    //   case 5:
    //     level = 'lowLevel';
    //     break;
    //   case 6:
    //   case 7:
    //   case 8:
    //   case 9:
    //   case 10:
    //     level = 'highLevel';
    // }
    //
    // if (level){
    //     _addClass(muteButtons[index], level);
    // }

    volumeIndicator[index].style.width = volumePercent + '%';
    volumePlayhead[index].style.left = volumePercent + '%';
  }

  // Mute
  function mute( index, state ) {
    var oldVolume;
    if ( state ) {
      oldVolume = myAudio[index].volume;
      muteButtons[index].setAttribute( 'data-saved-volume', oldVolume );
      setVolume( index, 0 );
      _addClass( muteButtons[index], 'songMuted' );
      _removeClass( muteButtons[index], 'songUnmuted' );
      muteButtons[index].firstChild.innerHTML = 'unmute';
    } else {
      // myAudio[index].volume = 0;
      oldVolume = muteButtons[index].getAttribute( 'data-saved-volume' );
      if ( typeof oldVolume != 'undefined' && oldVolume > 0 ) {
        setVolume( index, oldVolume );
      } else {
        setVolume( index, 1 );
      }
      _removeClass( muteButtons[index], 'songMuted' );
      _addClass( muteButtons[index], 'songUnmuted' );
      muteButtons[index].firstChild.innerHTML = 'mute';
    }
  }

  // Play or pause a track
  function playPause( index, state ) {
    var buttonText = playPauseButtonsText[index];
    var target = playPauseButtons[index];
    if ( state ) {
      for ( i = 0; i < playPauseButtons.length; i++ ) {
        _removeClass( playPauseButtons[i], 'songPlaying' );
        _addClass( playPauseButtons[i], 'songPaused' );
        playPauseButtonsText[i].innerHTML = 'play';
      }
      playSong( index );
      _addClass( target, 'songPlaying' );
      _removeClass( target, 'songPaused' );
      buttonText.innerHTML = 'pause';
    } else {
      pauseAll();
      _removeClass( target, 'songPlaying' );
      _addClass( target, 'songPaused' );
      buttonText.innerHTML = 'play';
    }
  }

  function _setTime(index, time) {

    myAudio[index].currentTime = time;
    _updateProgress( index );

  }

  function _getCurrentTime(index) {

    return myAudio[index].currentTime;

  }

  // Toggle 'play' and 'pause' for a track
  function _playPauseAudio() {
    var targetSong = this.parentNode.getAttribute( 'data-song-index' );
    if ( typeof targetSong != 'undefined' ) {
      var playSong = ( _hasClass( this, 'songPlaying' ) ? false : true );
      playPause( targetSong, playSong );
    } else {
      console.log( 'too soon to play!' );
    }
  }

  function _rewindAudio() {

    var targetSong = this.parentNode.getAttribute( 'data-song-index' );
    if ( typeof targetSong != 'undefined' ) {
      var currentTime = _getCurrentTime(targetSong);
      _setTime(targetSong, currentTime - 15);

    } else {
      console.log( 'too soon to rewind!' );
    }

  }
  function _fwdAudio() {

    var targetSong = this.parentNode.getAttribute( 'data-song-index' );
    if ( typeof targetSong != 'undefined' ) {
      var currentTime = _getCurrentTime(targetSong);
      _setTime(targetSong, currentTime + 15);

    } else {
      console.log( 'too soon to forward!' );
    }

  }

  // Toggle 'mute' for a track
  function _muteUnmuteAudio() {
    var targetSong = this.parentNode.parentNode.getAttribute( 'data-song-index' );
    var buttonText = playPauseButtonsText[targetSong];
    if ( _hasClass( this, 'songMuted' ) ) {
      mute( targetSong, false );
      // _removeClass(this,'songMuted');
      // _addClass(this,'songUnmuted');
      // buttonText.innerHTML = 'mute';
    } else {
      mute( targetSong, true );
      // _addClass(this,'songMuted');
      // _removeClass(this,'songUnmuted');
      // buttonText.innerHTML = 'unmute';
    }
  }

  // Get index of track to be updated, then pass it to _updateProgress()
  function _triggerUpdateProgress() {
    var index = this.getAttribute( 'data-song-index' );
    _updateProgress( index );
  }

  // Set the value of the current-position display for a playing song
  function _updateProgress( index ) {
    var progress = myAudio[index].currentTime;
    var duration = myAudio[index].duration;
    progressParsed = _secondsToMMSS( progress );
    playTimer[index].innerHTML = progressParsed;
    if ( progress >= duration ) {
      _removeClass( playPauseButtons[index], 'songPlaying' );
    }
    var progressPercent = ( progress / duration * 100 ).toFixed( 2 );
    progressBar[index].value = progressPercent;
    indicator[index].style.width = progressPercent + '%';
    playhead[index].style.left = progressPercent + '%';
  }

  // Set the value of the song-length display
  function _setLengthDisplay( index ) {
    var songLength = myAudio[index].duration;
    var duration = _secondsToMMSS( songLength );
    var songClass = '.song' + index;
    songLengthBox[index].innerHTML = duration;
  }

  function _showTime (event) {

    var width = this.dataset.width,
        index = this.dataset.songIndex,
        offset = event.offsetX,
        duration = myAudio[index].duration,
        progress = _secondsToMMSS(offset / width * duration);

    timeIndicators[index].style.left = offset / width * 100 + '%';
    timeIndicators[index].innerHTML = progress;

  }

  /**
   * --------------
   * ERROR HANDLING
   *
   * Functions that
   * will display a
   * warning notice
   * when any error
   * is triggered.
   * --------------
   */

  function _errors( e ) {
    // console.log( 'error: ' );
    // console.log( e.type );
    var index = this.getAttribute( 'data-song-index' );
    // console.log( myAudio[index].error );
    // console.log(e);
  }

  function _error( e ) {
    var index = this.getAttribute( 'data-song-index' );
    var error = myAudio[index].error;
    // console.log( 'error: ' );
    // console.log(e);
    // console.log( error );
  }
  function _stalled( e ) {
    // console.log( 'stalled!' );
    var index = this.getAttribute( 'data-song-index' );
    // console.log( 'Target: ' + index );
    // console.log( 'Play?: ' + false );
    playPause( index, false );
  }
  function _waiting() {
    // console.log( 'waiting!' );
  }

  function _progress( e ){
    var index = this.getAttribute( 'data-song-index' );
    var readyState = myAudio[index].readyState;
  }

  /**
   * -----------------------------
   * HELPERS
   *
   * These are basic utilities to
   * parse data, add/remove/toggle
   * classes etc.
   * -----------------------------
   */

  // Convert seconds into minutes-and-seconds (MMSS) format
  // @since 15.05.2017 - added support for duration bigger than hour
  function _secondsToMMSS( seconds ) {

    var hours,
      mins,
      secs,
      formatted = '';

    var SECS_IN_HOUR = 3600;

    mins = Math.floor( seconds % SECS_IN_HOUR / 60 );
    mins = mins.toFixed( 0 );
    mins = mins.toString();

    if ( seconds > SECS_IN_HOUR ) {
      hours = Math.floor(seconds / SECS_IN_HOUR);
      formatted = hours + ':';

      mins = mins < 10 ? '0' + mins : mins;
    }


    secs = Math.floor( seconds % SECS_IN_HOUR % 60 );
    secs = secs.toFixed( 0 );
    secs = secs.toString();

    if ( secs < 10 ) {
      secs = '0' + secs;
    }

    formatted += mins + ':' + secs;
    return formatted;
  }

  // Does the target element have the target class?
  function _hasClass( el, className ) {
    var result;
    if ( el.classList ) {
      result = el.classList.contains( className );
    } else {
      result = new RegExp( '(^| )' + className + '( |$)', 'gi' ).test( el.className );
    }
    return result;
  }

  // Add a class to the target element.
  function _addClass( el, className ) {
    if ( el.classList ) {
      el.classList.add( className );
    }
    else {
      el.className += ' ' + className;
    }
  }

  // Remove a class from the target element.
  function _removeClass( el, className ) {
    if ( el.classList ) {
      el.classList.remove( className );
    }
    else {
      el.className = el.className.replace( new RegExp( '(^|\\b)' + className.split( ' ' ).join( '|' ) + '(\\b|$)', 'gi' ), ' ' );
    }
  }

  // Get File Type
  function _getFileType( string ) {
    return string.substr( ( ~-string.lastIndexOf( "." ) >>> 0 ) + 2 );
  }

  // Get File Name
  function _getFileName( string ) {
    var fullFileName = string.replace( /^.*[\\\/]/, '' );
    var withNoExtension = fullFileName.split( '.' )[0];
    return withNoExtension;
  }

  /**
   * ----------------------
   * PUBLIC METHODS
   *
   * Declare the methods we
   * want to be accessible
   * from outside scope.
   * ----------------------
   */

  return {
    sliderScrub: sliderScrub,
    playSong: playSong,
    pauseAll: pauseAll,
    destroy : destroy
  };
}

module.exports = Picobel;