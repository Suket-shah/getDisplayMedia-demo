"use strict";

var constraints = { video: true, audio: true };

var shareBtn = document.querySelector("button#shareScreen");
var recBtn = document.querySelector("button#rec");
var stopBtn = document.querySelector("button#stop");

var videoElement = document.querySelector("video");
var dataElement = document.querySelector("#data");
var downloadLink = document.querySelector("a#downloadLink");

videoElement.controls = false;

var mediaRecorder;
var chunks = [];
var count = 0;
var localStream = null;

function onShareScreen() {
      navigator.mediaDevices.getDisplayMedia(constraints).then(function(screenStream) {
          var composedStream = new MediaStream();

          //added the video stream from the screen
          screenStream.getVideoTracks().forEach(function(videoTrack) {
            composedStream.addTrack(videoTrack);
          });
            
          getStreamSuccess(composedStream);
      })
    }

function getStreamSuccess(stream) {
  localStream = stream;
  localStream.getTracks().forEach(function(track) {
    if (track.kind == "video") {
      track.onended = function(event) {
        log("video track.onended Audio track.readyState=" + track.readyState + ", track.muted=" + track.muted);
      };
    }
  });

  videoElement.srcObject = localStream;
  videoElement.play();
  videoElement.muted = true;
  recBtn.disabled = false;
  shareBtn.disabled = true;
}

function onBtnRecordClicked() {
  if (localStream == null) {
    alert("Could not get local stream from mic/camera");
  } else {
    recBtn.disabled = true;
    stopBtn.disabled = false;

    /* use the stream */
    log("Start recording...");
    if (typeof MediaRecorder.isTypeSupported == "function") {
      if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9")) {
        var options = { mimeType: "video/webm;codecs=vp9,opus" };
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=h264")) {
        var options = { mimeType: "video/webm;codecs=h264" };
      } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8")) {
        var options = { mimeType: "video/webm;codecs=vp8,opus" };
      }
      log("Using " + options.mimeType);
      mediaRecorder = new MediaRecorder(localStream, options);
    } else {
      log("isTypeSupported is not supported, using default codecs for browser");
      mediaRecorder = new MediaRecorder(localStream);
    }

    mediaRecorder.ondataavailable = function(e) {
      log("data available");
      chunks.push(e.data);
    };

    mediaRecorder.onerror = function(e) {
      log("mediaRecorder.onerror: " + e);
    };

    mediaRecorder.onstart = function() {
      log("mediaRecorder.onstart, mediaRecorder.state = " + mediaRecorder.state);

      localStream.getTracks().forEach(function(track) {
        if (track.kind == "audio") {
          log("onstart - Audio track.readyState=" + track.readyState + ", track.muted=" + track.muted);
        }
        if (track.kind == "video") {
          log("onstart - Video track.readyState=" + track.readyState + ", track.muted=" + track.muted);
        }
      });
    };

    mediaRecorder.onstop = function() {
      log("mediaRecorder.onstop, mediaRecorder.state = " + mediaRecorder.state);

      var blob = new Blob(chunks, { type: "video/webm" });
      chunks = [];

      var videoURL = window.URL.createObjectURL(blob);

      downloadLink.href = videoURL;
      videoElement.src = videoURL;
      downloadLink.innerHTML = "Download video file";

      var rand = Math.floor(Math.random() * 10000000);
      var name = "video_" + rand + ".webm";

      downloadLink.setAttribute("download", name);
      downloadLink.setAttribute("name", name);
    };

    mediaRecorder.onwarning = function(e) {
      log("mediaRecorder.onwarning: " + e);
    };

    mediaRecorder.start(100);

    localStream.getTracks().forEach(function(track) {
      log(track.kind + ":" + JSON.stringify(track.getSettings()));
      console.log(track.getSettings());
    });
  }
}

function onBtnStopClicked() {
  mediaRecorder.stop();
  videoElement.controls = true;
  recBtn.disabled = false;
  stopBtn.disabled = true;
}

function onStateClicked() {
  if (mediaRecorder != null && localStream != null) {
    log("mediaRecorder.state=" + mediaRecorder.state);
    log("mediaRecorder.mimeType=" + mediaRecorder.mimeType);
    log("mediaRecorder.videoBitsPerSecond=" + mediaRecorder.videoBitsPerSecond);
    log("mediaRecorder.audioBitsPerSecond=" + mediaRecorder.audioBitsPerSecond);

    localStream.getTracks().forEach(function(track) {
      if (track.kind == "audio") {
        log("Audio: track.readyState=" + track.readyState + ", track.muted=" + track.muted);
      }
      if (track.kind == "video") {
        log("Video: track.readyState=" + track.readyState + ", track.muted=" + track.muted);
      }
    });
  }
}

function log(message) {
  dataElement.innerHTML = dataElement.innerHTML + "<br>" + message;
  console.log(message);
}