// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
"use strict";

const youtubedl = require('youtube-dl');
const fs = require('fs');
const path = require('path');
const electron = require('electron');
const exec = require('child_process').exec;

const {dialog} = require('electron').remote;
var currentWindow = electron.remote.getCurrentWindow();
var electronShell = require("electron").shell;
var dataPath = currentWindow.dataPath.replace(/ /g,"\\ "); 
var desktopPath = currentWindow.desktopPath;
console.log("dataPath",dataPath)

var alignBtnEl = document.getElementById('alignBtn');
var exportSrtBtnEl = document.getElementById('exportSrtBtn');

var selectFileBtnEl = document.getElementById('selectFileBtn');
var loadYoutubeUrlBtnEl = document.getElementById('loadYoutubeUrlBtn');
var videoYoutubeUrlInputEl = document.getElementById('videoYoutubeUrlInput');

var videoPreviewEl = document.getElementById('videoPreview');

var textBoxEl = document.getElementById('textBox');

var checkboxInputEl = document.getElementById('checkboxInput');

var timeout = null;
var resumeTiypingTimeInterval = 600;
var startStopPlayingVideoOntyping = true;

var isYoutubeVideo = false;

var sourceVideoPath ="";


checkboxInputEl.onclick = function(e){
	// e.preventDefault();
	if(startStopPlayingVideoOntyping == false){
		startStopPlayingVideoOntyping = true;
	}else{
		startStopPlayingVideoOntyping = false;
	}
};

selectFileBtnEl.onclick = function(){
	// e.preventDefault()
	isYoutubeVideo = false; 

	dialog.showOpenDialog({properties: ['openFile']}, function(file){
		console.log(file[0]);
		sourceVideoPath = file[0];
		loadHtml5Video(sourceVideoPath);
		// loadEditorWithDummyText();

	});
};


exportSrtBtnEl.onclick = function(){
	//assumes allignment has been run, perhaps add a boolean flag to check that it is the case. 
	
	//read content of textEditor. 

	var fileName = path.basename(sourceVideoPath);
	//prompt user on where to save. add srt extension if possible. 
	var newFilePath = desktopPath +"/"+ fileName+".srt";
	fs.writeFileSync(newFilePath, getContentFromTextEditor(), 'utf8');
	// or just save to desktop. 
	alert("your file has been saved on the desktop "+newFilePath);

}

alignBtnEl.onclick = function(){
	//create text file of content of text box. in tmp folder.
	var textFile = createTextFileFromTextEditor();
	var fileName = path.basename(sourceVideoPath);
	var outPutSegmentedFile =   dataPath+"/"+fileName+"._segmented"+".txt";
	console.log('outPutSegmentedFile',outPutSegmentedFile);
	//should call perl scrip to prep on textfile to prep it for aeneas
	
	//TODO add:  if(sourceVideoPath !="")
	var config={
		language: "eng", 
		captionFileFormat : "srt",
		audio_file_head_length : 0,//eg 12.000
		audio_file_tail_length : 0, //16.000
	 	mediaFile : sourceVideoPath,
	 	outPutSegmentedFile : outPutSegmentedFile,
		textFile : textFile
	};

	segmentTranscript(config, function(resp){

		runAeneasComand(config, function(srtFilePath){

			textBoxEl.innerText =fs.readFileSync(srtFilePath).toString();	

				//clear up 
				fs.unlinkSync(outPutSegmentedFile);
				fs.unlinkSync(textFile);
				fs.unlinkSync(srtFilePath);

				makeSrtTimeCodesIntoLinks();
				addLinksToSrtTimecodes();

		});
	})
	

	//
};


//return path to file 
function createTextFileFromTextEditor(){
	var fileName = path.basename(sourceVideoPath);
	console.log('fileName',fileName);

	//TODO: add path.  use path library
	var tmpTextFileName = dataPath+"/"+ fileName+".txt";
	console.log('tmpTextFileName',tmpTextFileName)
	fs.writeFileSync(tmpTextFileName, getContentFromTextEditor(),'utf8');
	return tmpTextFileName; 
}

function getContentFromTextEditor(){
	//TODO: add sanitise step.
	return textBoxEl.innerText;

}

function loadHtml5Video(path){
	videoPreviewEl.innerHTML = `<video width="100%" controls>
  <source src="${path}" type="video/mp4">`;
  initializeVideoPlayPuaseTypingPreferences();
}

// TODO: you can't seem to be able to change this preference after having loaded the video. Needs fixing.
// Use case, you are reviewing the text without emphasis on a speicific part.
function initializeVideoPlayPuaseTypingPreferences(){

	textBoxEl.onkeyup = function () {
		if(startStopPlayingVideoOntyping){
			clearTimeout(timeout);
			pauseVideo();
			//add timer logic to start playing after set interval.
			timeout = setTimeout(function () {
		        // console.log('Input Value:', textInput.value);
		        playVideo();
	  		 }, resumeTiypingTimeInterval);
		}
	};
};


// selectFileBtnEl.onclick = function(e){
// 	e.preventDefault();
// 	//TODO
// };


 function makeSrtTimeCodesIntoLinks () {
		// console.log(textBoxEl.innerHTML);
		//http://pietropassarelli.com/regex.html
		textBoxEl.innerHTML = textBoxEl.innerHTML.replace(/(\d{2}[:|.]\d{2}[:|.]\d{2}[.|,|:]\d{3})/ig , function replace(match) { //(?!<)
		    return '<a class="timecodeLink">' + match + '</a>'; 
		});
		//TODO: Move curson back to it's possition after replacement editable
		
		//add event listener on class name. 
		//https://stackoverflow.com/questions/19655189/javascript-click-event-listener-on-class
};




function addLinksToSrtTimecodes(){
	var timecodesEl = document.querySelectorAll('.timecodeLink');

	timecodesEl.forEach(function(element, index){
		element.onclick = function(){
			setVideoCurrentTime(element.innerText)
		}
	})
}


function setVideoCurrentTime(timecode){

	//convert timecode
	var time = convertTimeCodeToSeconds(timecode);
	
	if(isYoutubeVideo){
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
		// innerDoc.querySelectorAll('video')[0].click();
		innerDoc.querySelectorAll('video')[0].currentTime = time ;

	}else{
		var video = document.querySelector('video');
		video.currentTime = time ;
	}
}



loadYoutubeUrlBtnEl.onclick = function(e){
	e.preventDefault();
	isYoutubeVideo = true;
	var url = videoYoutubeUrlInputEl.value;
	//TODO: add validation to check it's a valid youtube URL.
	var youtubeId = youtubeUrlExtractId(url);
	populateYoutubePlayer(youtubeId);

	// var captionsFiles = downloadCaptions(url);
	// console.log(captionsFiles);
	// var captionsContent = openFile(captionsFiles[0]);
	
	// loadEditorWithDummyText();
};


function openFile(path){
	return fs.readFileSync(path).toString('utf-8');
}


function loadEditorWithDummyText(){
		textBoxEl.innerText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed accumsan urna nec dui lacinia porttitor. Etiam eget rutrum quam, in hendrerit sapien. Etiam sed placerat lectus. Etiam viverra fermentum lacus non rhoncus. Fusce tristique lacus turpis, ac consequat lorem rhoncus a. Maecenas tempus massa sed ex ullamcorper ultrices. Nam eget pharetra risus, id ultrices sapien. Proin a euismod sem, sed dignissim dolor. Maecenas fringilla sem in ligula pellentesque venenatis. Sed eget ipsum tempus, euismod ex id, sollicitudin ipsum. Vestibulum pretium justo a dolor tincidunt, posuere ultrices nisl dapibus. Proin pretium ultricies posuere. Quisque faucibus arcu id dolor pulvinar congue. Aenean quis finibus magna. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam dignissim vehicula volutpat.

Vestibulum fermentum arcu nisl, placerat faucibus ex semper tempus. Aliquam mattis, sem sed accumsan fringilla, dolor mi sagittis nunc, quis suscipit dui turpis sed justo. Curabitur lacinia vulputate leo, et pharetra ipsum laoreet a. Nunc sagittis nulla mi, in dignissim ex molestie quis. Etiam hendrerit tincidunt diam, eget fringilla mauris ultrices et. Mauris quam mauris, dictum ut orci vitae, sodales ultrices arcu. Proin sed rhoncus ex. Ut pellentesque pellentesque justo, ac consectetur sapien. Praesent at tortor magna. Ut id ligula risus. Aliquam vestibulum nisi vel justo feugiat consequat.

Mauris pellentesque orci at tellus porttitor, eu tempus urna sodales. Praesent et volutpat nisi. Vestibulum laoreet sollicitudin lacus, nec faucibus elit auctor in. Nunc malesuada orci quam, vel vulputate ante mollis viverra. Donec at velit dictum, lobortis massa vel, pharetra sapien. Praesent elementum magna eu orci gravida, in interdum tellus blandit. Quisque efficitur venenatis ex, eget laoreet erat facilisis eu. Praesent suscipit magna a neque dignissim iaculis. Curabitur pellente`;

}

function downloadCaptions(url){

  var options = {
    // Write automatic subtitle file (youtube only)
    auto: true,
    // Downloads all the available subtitles.
    all: true,
    // Languages of subtitles to download, separated by commas.
    lang: 'en',
    // The directory to save the downloaded files in.
    cwd: dataPath,
  };

  youtubedl.getSubs(url, options, function(err, files) {
    if (err) throw err;
    // setCaptionsStatus(subtitlesDownloadedMessage);
    console.info('subtitle files downloaded:', files);
    return files;
  });
}



function youtubeUrlExtractId(url){
	var urlParts = url.split("/");
	var urlPartsLegth = urlParts.length;
	var youtubeId = urlParts[urlPartsLegth-1]
	return youtubeId;
}

function setTextBoxContent(text){
	//todo: sanitise `text`
	textBoxEl.innerHTML = text;
}


function getTextBoxContent(){
	// convert from html
	return textBoxEl.innerHTML;
}



function populateYoutubePlayer(id){
	console.log(id);
	//simple implementation 
	var youtubeElement = `<iframe id="youtubeIframe" width='560' height='315' class='embed-responsive-item' src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
	// var youtubeElement = `<video width="640" height="360"><source type="video/youtube" src="http://www.youtube.com/watch?v=${id}" /></video>`
	videoPreviewEl.innerHTML = youtubeElement;
	// document.querySelector( 'video' ).addEventListener("playing", checkIfTypingPause, false);
	document.getElementById('youtubeIframe').onload= function() {
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
		//start video 
		innerDoc.querySelectorAll('video')[0].click();
		
		initializeVideoPlayPuaseTypingPreferences();
	};
}



function playVideo(){
	console.log("play video ");
	// document.querySelector( 'video' ).play();
	if(isYoutubeVideo){
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
		// innerDoc.querySelectorAll('video')[0].click();
		innerDoc.querySelectorAll('video')[0].play();
	}else{
		var video = document.querySelector('video');
		video.play();
	}
		
}

function pauseVideo(){
	if(isYoutubeVideo){
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
		// document.querySelector( 'video' ).pause();
		innerDoc.querySelectorAll('video')[0].pause();
	}else{
		var video = document.querySelector('video');
		video.pause();
	}
	
}


function populateVideoPlayer(url){

}

function runAeneasComand(config,cb){
	var mediaFile = config.mediaFile;
	var textFile = config.textFile;
	var language = config.language;
	var captionFileFormat = config.captionFileFormat;
	var audio_file_head_length = config.audio_file_head_length;//eg 12.000
	var audio_file_tail_length = config.audio_file_tail_length; //16.000
	// var tmpTextFileName = dataPath +"/"+ fileName;
	var fileName = path.basename(mediaFile);
	var outputCaptionFile = dataPath+"/"+fileName+"."+captionFileFormat;
	console.log(JSON.stringify(config,null,2));

	var aeneasComandString = `aeneas_execute_task "${mediaFile}" "${textFile}" "task_language=${language}|os_task_file_format=${captionFileFormat}|is_text_type=subtitles|is_audio_file_head_length=${audio_file_head_length}|is_audio_file_tail_length=${audio_file_tail_length}|task_adjust_boundary_nonspeech_min=1.000|task_adjust_boundary_nonspeech_string=REMOVE|task_adjust_boundary_algorithm=percent|task_adjust_boundary_percent_value=75|is_text_file_ignore_regex=[*]" ${outputCaptionFile}`//.srt
	// var aeneasComandString = `aeneas_execute_task "/Users/pietropassarelli/Desktop/tmp19Jul17/TMP2/Demo_media/Vox.com/norman_door/norman_door_trimmed2.mp4" "/Users/pietropassarelli/Desktop/electron-quick-start/norman_door_trimmed2.mp4.txt" "task_language=eng|os_task_file_format=srt|is_text_type=subtitles|is_audio_file_head_length=0|is_audio_file_tail_length=0|task_adjust_boundary_nonspeech_min=1.000|task_adjust_boundary_nonspeech_string=REMOVE|task_adjust_boundary_algorithm=percent|task_adjust_boundary_percent_value=75|is_text_file_ignore_regex=[*]" ./new2_ocb_example.srt `
	// const { exec } = require('child_process');

	// exec(aeneasComandString, (err, stdout, stderr) => {
	//   if (err) {
	//     // node couldn't execute the command
	//     return;
	//   }

	//   // the *entire* stdout and stderr (buffered)
	//   console.log(`stdout: ${stdout}`);
	//   console.log(`stderr: ${stderr}`);
	// });
	 
	
	// const { spawn } = require('child_process');
	// const ls = spawn('aeneas_execute_task',[mediaFile, textFile, 'task_language',language, 'os_task_file_format',captionFileFormat,'is_text_type','subtitles','is_audio_file_head_length',audio_file_head_length,'is_audio_file_tail_length',audio_file_tail_length,'task_adjust_boundary_nonspeech_min',1.000,'task_adjust_boundary_nonspeech_string','REMOVE','task_adjust_boundary_algorithm','percent','task_adjust_boundary_percent_value',75,'is_text_file_ignore_regex','[*]',mediaFile+"."+captionFileFormat]);//'PYTHONIOENCODING','UTF-8'

	// ls.stdout.on('data', (data) => {
	//   console.log(`stdout: ${data}`);
	// });

	// ls.stderr.on('data', (data) => {
	//   console.log(`stderr: ${data}`);
	// });

	// ls.on('close', (code) => {
	//   console.log(`child process exited with code ${code}`);
	// });
	 
	
	exec(aeneasComandString, function(error, stdout, stderr) {
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if(cb){cb(outputCaptionFile)};
	    if (error !== null) {
	        console.log('exec error: ' + error);
	    }
	});
}



function segmentTranscript(config,cb){
	var inputFile 				= config.textFile;
	var outPutSegmentedFile 	= config.outPutSegmentedFile;
	var segmentTranscriptComand =`perl ./sentence-boundary.pl -d ./HONORIFICS -i ${inputFile} -o ${outPutSegmentedFile}`;
		exec(segmentTranscriptComand, function(error, stdout, stderr) {
		if(cb){cb(outPutSegmentedFile)}
	    console.log('stdout: ' + stdout);
	    console.log('stderr: ' + stderr);
	    if (error !== null) {
	        console.log('exec error: ' + error);
	    }
	});
}


// var timeMs = function(val) {
//     var regex = /(\d+):(\d{2}):(\d{2}),(\d{3})/;
//     var parts = regex.exec(val);

//     if (parts === null) {
//         return 0;
//     }

//     for (var i = 1; i < 5; i++) {
//         parts[i] = parseInt(parts[i], 10);
//         if (isNaN(parts[i])) parts[i] = 0;
//     }

//     // hours + minutes + seconds + ms
//     return parts[1] * 3600000 + parts[2] * 60000 + parts[3] * 1000 + parts[4];
// };

// var timeSeconds = function(val) {

//     var milliseconds =  timeMs(val);
//     var seconds = milliseconds / 1000.0;
//     return seconds; 
// };

function convertTimeCodeToSeconds(timeString){

  var timeArray = timeString.split(":");

  var hours   = parseFloat(timeArray[0]) * 60 * 60;
  var minutes = parseFloat(timeArray[1]) * 60;
  var seconds = parseFloat(timeArray[2].replace(",","."));
  // var frames  = parseInt(timeArray[3].split(",")[1])*(1/framerate);
  // var str = "h:" + hours + "\nm:" + minutes + "\ns:" + seconds + "\nf:" + frames;
  // console.log(str);
  var totalTime = hours + minutes + seconds// + frames;

  //alert(timeString + " = " + totalTime)
  return totalTime;
}

//TODO: disable while speech to text 
//textBoxEl.innerHTML = "<i>Transcription in progress...</i>"
//textBoxEl.contentEditable = false
//textBoxEl.contentEditable = true



//to add captions dynamically  - Might not be needed as a requiremen
// maybe add button, update captions preview. or auto trigger. 
// might need to write the `vtt` file. and then code below to update on video.
// altho it better if video was bigger. 
// document.querySelector("video").innerHTML = '<track label="English Captions" srclang="en" kind="captions" src="/Users/pietropassarelli/Dropbox/CODE/NODE/webVideoTextCrawler/test/results.vtt" type="text/vtt" default />'