// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
"use strict";

const youtubedl = require('youtube-dl');
const fs = require('fs');
const path = require('path');
const electron = require('electron');
const exec = require('child_process').exec;
const child = require('child_process').execFile;
const { spawn } = require('child_process');
const webvtt = require('node-webvtt-youtube');
const {dialog} = require('electron').remote;
const tokenizer = require('sbd');
var currentWindow = electron.remote.getCurrentWindow();
var electronShell = require("electron").shell;
var dataPath = currentWindow.dataPath.replace(/ /g,"\\ "); 
var desktopPath = currentWindow.desktopPath;
var appPath = currentWindow.appPath;

console.log("appPath",appPath);
console.log("dataPath",dataPath);

var alignBtnEl = document.getElementById('alignBtn');
var exportSrtBtnEl = document.getElementById('exportSrtBtn');
var selectFileBtnEl = document.getElementById('selectFileBtn');
var loadYoutubeUrlBtnEl = document.getElementById('loadYoutubeUrlBtn');
var videoYoutubeUrlInputEl = document.getElementById('videoYoutubeUrlInput');
var videoPreviewEl = document.getElementById('videoPreview');
var textBoxEl = document.getElementById('textBox');
var checkboxInputEl = document.getElementById('checkboxInput');
var saveBtnEl = document.getElementById('saveBtn');
var restoreLastSavedVersionBtnEl = document.getElementById('restoreLastSavedVersionBtn');
var selectCaptionFormatEl = document.getElementById('selectCaptionFormat');
var selectLanguageForAlignementEl = document.getElementById('selectLanguageForAlignement');

var timeout = null;
var resumeTiypingTimeInterval = 600;
var startStopPlayingVideoOntyping = false;
var isYoutubeVideo = false;
var sourceVideoPath ="tempCaptionsMakerFile";
window.sourceVideoPath = sourceVideoPath;


restoreLastSavedVersionBtnEl.onclick = function(e){
	e.preventDefault();
	restoreStateFromLocalStorage();
};

saveBtnEl.onclick = function(e){
		e.preventDefault();
		saveToLocalStorage();
		alert("saved");
		// Then to repopulate on load if that is empty. 	
};

function saveToLocalStorage(){
	localStorage.captionsMakerState ={}
	//Horrible to save as HTML without serializing, but if save as TXT looses new line. 
	//TODO: Welcome sudgestions on how to improve on this
	localStorage.captionsMakerStateText = textBoxEl.innerHTML;
	localStorage.captionsMakerStateVideoSrc = sourceVideoPath;
}

function restoreStateFromLocalStorage(){
	//TODO: add notice, confirm, this will cancel the current session. do you want to continue? or relax, nothing happend. 
	if(localStorage.captionsMakerState){
		setTextBoxContent(localStorage.captionsMakerStateText);
		//
		makeSrtTimeCodesIntoLinks();
		addLinksToSrtTimecodes();
		//
		loadHtml5Video(localStorage.captionsMakerStateVideoSrc);
		isYoutubeVideo = false;
		sourceVideoPath = localStorage.captionsMakerStateVideoSrc;
	}else{
		alert("No previously saved version was found.");
	}
}

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

loadYoutubeUrlBtnEl.onclick = function(e){
	e.preventDefault();
	isYoutubeVideo = true;
	disableTextEditorProgressMessage();
	var url = videoYoutubeUrlInputEl.value;
	//TODO: add validation to check it's a valid youtube URL.
	var youtubeId = youtubeUrlExtractId(url);
	populateYoutubePlayer(youtubeId);

	//TODO: can I use path .join here to add extension to name?
	// var destFileName = dataPath+"/"+ youtubeId+".mp4";
	 // sourceVideoPath = destFileName;
	downloadYoutubeVideo(url, function(destPath){
		sourceVideoPath = destPath;
		loadHtml5Video(sourceVideoPath);
		isYoutubeVideo = false;

		console.log("sourceVideoPath+ ",sourceVideoPath)
	
		downloadCaptions(url, function(captionFiles){
			if (captionFiles.length ==0){
				alert("This video has no captions");
			}else{
				var captionFile = captionFiles[0];
				console.log("1,openYoutubeVttFile");
				openYoutubeVttFile(path.join(dataPath,captionFile));
				// var captionsContent = openFile(captionFiles[0]);
				
				console.log(captionFile);
			}
		});	
	});
};


exportSrtBtnEl.onclick = function(){
	//assumes allignment has been run, perhaps add a boolean flag to check that it is the case. 
	
	//read content of textEditor. 

	var fileName = path.basename(sourceVideoPath);
	//prompt user on where to save. add srt extension if possible. 
	var newFilePath = desktopPath +"/"+ fileName+"."+getCaptionsFileFormat();
	fs.writeFileSync(newFilePath, getContentFromTextEditor(), 'utf8');
	// or just save to desktop. 
	alert("your file has been saved on the desktop "+newFilePath);

}


function getCaptionsFileFormat(){
	return selectCaptionFormatEl.value ;
}

function getLanguageForAlignement(){
	return selectLanguageForAlignementEl.value;
}

alignBtnEl.onclick = function(){
	//create text file of content of text box. in tmp folder.
	var textFile = createTextFileFromTextEditor();
	var fileName = path.basename(sourceVideoPath);
	var outPutSegmentedFile =   dataPath+"/"+fileName+"._segmented"+".txt";
	// console.log("sourceVideoPath in alignBtnEl ", sourceVideoPath);
	// console.log('outPutSegmentedFile',outPutSegmentedFile);
	//should call perl scrip to prep on textfile to prep it for aeneas
	
	//TODO add:  if(sourceVideoPath !="")
	var config={
		language: getLanguageForAlignement(), 
		captionFileFormat : getCaptionsFileFormat(),
		audio_file_head_length : 0,//eg 12.000
		audio_file_tail_length : 0, //16.000
	 	mediaFile : sourceVideoPath,
	 	outPutSegmentedFile : outPutSegmentedFile,
		textFile : textFile
	};

	segmentTranscript(config, function(respSegmentedFileContent){

		// console.log("LDLDL",fs.readFileSync(respSegmentedFileContent ).toString());

		// config.outPutSegmentedFile = respSegmentedFilePath; 
		
		config.outPutSegmentedFile = respSegmentedFileContent;

		console.log('config.outPutSegmentedFile',config.outPutSegmentedFile);
		console.log("LDLDL",fs.readFileSync(respSegmentedFileContent ).toString());

		runAeneasComand(config, function(srtFilePath){
			// console.log("srtFilePath",srtFilePath);

			textBoxEl.innerText =fs.readFileSync(srtFilePath,'utf8').toString('utf8');	

				//clear up 
				// fs.unlinkSync(outPutSegmentedFile);
				// fs.unlinkSync(textFile);
				// fs.unlinkSync(srtFilePath);

				makeSrtTimeCodesIntoLinks();
				addLinksToSrtTimecodes();

		});
	})
	

	//
};


//return path to file 
function createTextFileFromTextEditor(){
	var fileName = path.basename(sourceVideoPath);
	// console.log('fileName',fileName);

	//TODO: add path.  use path library
	var tmpTextFileName = dataPath+"/"+ fileName+".txt";
	// console.log('tmpTextFileName',tmpTextFileName)
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
		innerDoc.querySelectorAll('video')[0].currentTime = time;
		playVideo();

	}else{
		var video = document.querySelector('video');
		video.currentTime = time ;
		playVideo();
	}
}




function openYoutubeVttFile(path){
	// console.log("2,openYoutubeVttFile");
	var vttFileContent = openFile(path);
	console.log(path,vttFileContent);
	//Do some parting
	
	var parsed = parseYoutubeVtt(vttFileContent);
	//add punctuation 
	punctuatorPostRequest(parsed, function(respText){
		// console.log('respText',JSON.stringify(respText,null,2));
		setTextBoxContent(respText);

		textEditorContentEditable(true);
	});
	
}


function parseYoutubeVtt(vtt){
	var vttJSON =webvtt.parse(vtt);
	var result ="";
	vttJSON.cues.forEach(function(line, index){
		result+= parseYoutubeVttTextLine(line.text)+" ";
	})
	return result;
}


function parseYoutubeVttTextLine(textLine){
	//used http://scriptular.com/
	return textLine.replace(/<[A-z|.|0-9|:|/]*>/g,"");
}


function openFile(path){
	return fs.readFileSync(path,'utf8').toString('utf-8');
}


function loadEditorWithDummyText(){
		textBoxEl.innerText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed accumsan urna nec dui lacinia porttitor. Etiam eget rutrum quam, in hendrerit sapien. Etiam sed placerat lectus. Etiam viverra fermentum lacus non rhoncus. Fusce tristique lacus turpis, ac consequat lorem rhoncus a. Maecenas tempus massa sed ex ullamcorper ultrices. Nam eget pharetra risus, id ultrices sapien. Proin a euismod sem, sed dignissim dolor. Maecenas fringilla sem in ligula pellentesque venenatis. Sed eget ipsum tempus, euismod ex id, sollicitudin ipsum. Vestibulum pretium justo a dolor tincidunt, posuere ultrices nisl dapibus. Proin pretium ultricies posuere. Quisque faucibus arcu id dolor pulvinar congue. Aenean quis finibus magna. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam dignissim vehicula volutpat.

Vestibulum fermentum arcu nisl, placerat faucibus ex semper tempus. Aliquam mattis, sem sed accumsan fringilla, dolor mi sagittis nunc, quis suscipit dui turpis sed justo. Curabitur lacinia vulputate leo, et pharetra ipsum laoreet a. Nunc sagittis nulla mi, in dignissim ex molestie quis. Etiam hendrerit tincidunt diam, eget fringilla mauris ultrices et. Mauris quam mauris, dictum ut orci vitae, sodales ultrices arcu. Proin sed rhoncus ex. Ut pellentesque pellentesque justo, ac consectetur sapien. Praesent at tortor magna. Ut id ligula risus. Aliquam vestibulum nisi vel justo feugiat consequat.

Mauris pellentesque orci at tellus porttitor, eu tempus urna sodales. Praesent et volutpat nisi. Vestibulum laoreet sollicitudin lacus, nec faucibus elit auctor in. Nunc malesuada orci quam, vel vulputate ante mollis viverra. Donec at velit dictum, lobortis massa vel, pharetra sapien. Praesent elementum magna eu orci gravida, in interdum tellus blandit. Quisque efficitur venenatis ex, eget laoreet erat facilisis eu. Praesent suscipit magna a neque dignissim iaculis. Curabitur pellente`;

}

function downloadCaptions(url,cb){
	// console.log("downloadCaptions");
  var options = {
    // Write automatic subtitle file (youtube only)
    auto: true,
    // Downloads all the available subtitles.
    all: false,
    // Languages of subtitles to download, separated by commas.
    lang: 'en',
    // format: 'srt/vtt',
    // The directory to save the downloaded files in.
    cwd: dataPath,
  };

  youtubedl.getSubs(url, options, function(err, files) {
    if (err) throw err;

    if(cb){cb(files);}
    // setCaptionsStatus(subtitlesDownloadedMessage);
    console.info('subtitle files downloaded:', files);
    return files;
  });
}



function downloadYoutubeVideo(url, cb){
	//update user GUI on status of download
  // setStatusElement(downloadingMessage);
  // reset captions status
  // setCaptionsStatus('...');
	var destFilePathName; 

  //setup download with youtube-dl
  var video = youtubedl(url,
    // Optional arguments passed to youtube-dl. 
    // see here for options https://github.com/rg3/youtube-dl/blob/master/README.md
    ['--format=best'],

    // Additional options can be given for calling `child_process.execFile()`. 
    { cwd: dataPath, maxBuffer: Infinity });

  //listener for video info, to get file name 
  video.on('info', function(info) {
  	// console.log("video-info",JSON.stringify(info,null,2));
    destFilePathName =  path.join(dataPath,info._filename.replace(/ /g,"_"));//info._filename); 
  	// console.log("destFilePathName-",destFilePathName);
    // update GUI with info on the file being downloaded 
    // setInfoPanel('<div class="alert alert-dismissible alert-success"><strong>Filename: </strong>' + info._filename+'<br><strong>size: </strong>' + info.size+'<br>'+'<strong>Destination: </strong>'+destFilePathName+"</div>");

    //TODO: sanilitse youtube file name so that it can be 

    //save file locally 
    var writeStream = fs.createWriteStream(destFilePathName);
    video.pipe(writeStream);
  });


  video.on('end', function() {
    //TODO: replace with update Div symbol
    // setStatusElement(finishedDownloadingMessage);
    if(cb){cb(destFilePathName)};
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
	// console.log(id);
	//simple implementation 
	var youtubeElement = `<iframe id="youtubeIframe" width='560' height='315' class='embed-responsive-item' src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
	// var youtubeElement = `<video width="640" height="360"><source type="video/youtube" src="http://www.youtube.com/watch?v=${id}" /></video>`
	videoPreviewEl.innerHTML = youtubeElement;
	// document.querySelector( 'video' ).addEventListener("playing", checkIfTypingPause, false);
	document.getElementById('youtubeIframe').onload= function() {
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;
		//start video 
		//TODO: decide whether to enable this or not. maybe make as an option?
		// innerDoc.querySelectorAll('video')[0].click();
		
		initializeVideoPlayPuaseTypingPreferences();
	};
}



function playVideo(){
	// console.log("play video ");
	// document.querySelector( 'video' ).play();
	if(isYoutubeVideo){
		var iframe = document.querySelector('iframe');
		var innerDoc = iframe.contentDocument || iframe.contentWindow.document;

		if(innerDoc.querySelectorAll('video')[0].src ==""){
			innerDoc.querySelectorAll('video')[0].click();
		}else{
			innerDoc.querySelectorAll('video')[0].play();
		}
		
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
	// console.log(JSON.stringify(config,null,2));
	var outPutSegmentedFile = config.outPutSegmentedFile;
	console.log("Aeneas outPutSegmentedFile",outPutSegmentedFile);
	///usr/local/bin/aeneas_execute_task
	var aeneasComandString = `/usr/local/bin/aeneas_execute_task "${mediaFile}" "${outPutSegmentedFile}" "task_language=${language}|os_task_file_format=${captionFileFormat}|is_text_type=subtitles|is_audio_file_head_length=${audio_file_head_length}|is_audio_file_tail_length=${audio_file_tail_length}|task_adjust_boundary_nonspeech_min=1.000|task_adjust_boundary_nonspeech_string=REMOVE|task_adjust_boundary_algorithm=percent|task_adjust_boundary_percent_value=75|is_text_file_ignore_regex=[*]" ${outputCaptionFile}`;
	// var productionEnv = Object.create(process.env);
	var aeneasPath = "/usr/local/bin/aeneas_execute_task";
	var ffmpegPath = "/usr/local/bin/ffmpeg";
	var ffprobePath = "/usr/local/bin/ffprobe";
	var espeakPath = "/usr/local/bin/espeak";
	var envVar =   {'ffmpeg': ffmpegPath , 'ffprobe': ffprobePath, 'espeak':espeakPath, 'aeneas_execute_task': aeneasPath};
	var options ={env: envVar, cwd: appPath}
	exec(aeneasComandString, function(error, stdout, stderr) {
	    console.log('stdout runAeneasComand: ' + stdout);
	    console.log('stderr runAeneasComand: ' + stderr);
	    if(cb){cb(outputCaptionFile)};
	    if (error !== null) {
	        console.log('exec error: ' + error);
	    }
	});

	//
	// var executablePath = "/usr/local/bin/aeneas_execute_task";
	// var parameters = [mediaFile,outPutSegmentedFile,"task_language",language,"--skip-validator", "os_task_file_format",captionFileFormat,"is_text_type","subtitles", "is_audio_file_head_length",audio_file_head_length,"is_audio_file_tail_length",audio_file_tail_length,"task_adjust_boundary_nonspeech_min",1.000,"task_adjust_boundary_nonspeech_string","REMOVE","task_adjust_boundary_algorithm","percent","task_adjust_boundary_percent_value",75,"is_text_file_ignore_regex","[*]",outputCaptionFile ];
	// const aeneasProcess = spawn(executablePath, parameters);

	// aeneasProcess.stdout.on('data', (data) => {
	//   console.log(`Result from aeneasProcess:  ${data}`);
	// });
	
	// var executablePath = "/usr/local/bin/aeneas_execute_task";
	// var aneneasComand = `${mediaFile} ${outPutSegmentedFile} "task_language=${language}|os_task_file_format=${captionFileFormat}|is_text_type=subtitles|is_audio_file_head_length=${audio_file_head_length}|is_audio_file_tail_length=${audio_file_tail_length}|task_adjust_boundary_nonspeech_min=1.000|task_adjust_boundary_nonspeech_string=REMOVE|task_adjust_boundary_algorithm=percent|task_adjust_boundary_percent_value=75|is_text_file_ignore_regex=[*]" ${outputCaptionFile}`
	// // var parameters = [mediaFile,outPutSegmentedFile,"task_language",language,"--skip-validator", "os_task_file_format",captionFileFormat,"is_text_type","subtitles", "is_audio_file_head_length",audio_file_head_length,"is_audio_file_tail_length",audio_file_tail_length,"task_adjust_boundary_nonspeech_min",1.000,"task_adjust_boundary_nonspeech_string","REMOVE","task_adjust_boundary_algorithm","percent","task_adjust_boundary_percent_value",75,"is_text_file_ignore_regex","[*]",outputCaptionFile ];
	// var parameters = []
	// parameters.push(aneneasComand);
	// child(executablePath, parameters, function(err, data) {
	//      console.log(err)
	//      console.log("data.toString()",data.toString());
	//      // fs.writeFileSync(outputCaptionFile,data.toString() ,"utf8");
	//      if(cb){cb(outputCaptionFile)};
	// });

}


window.segmentTranscript = segmentTranscript;

function segmentTranscript(config,cb){
	var inputFile 				= config.textFile;
	var outPutSegmentedFile 	= config.outPutSegmentedFile;
	// var segmentTranscriptComand =`perl ${appPath}/sentence-boundary.pl -d ${appPath}/HONORIFICS -i ${inputFile} -o ${outPutSegmentedFile}`;
	  sentenceBoundariesDetection(inputFile,outPutSegmentedFile, function(filePathSetencesWithLines){

			if(cb){cb(filePathSetencesWithLines);}
	 });

	
	// TODO: refactor this 
	

}

function sentenceBoundariesDetection(textFile,outPutSegmentedFile,cb){
	var options = {
	    "newline_boundaries" : true,
	    "html_boundaries"    : false,
	    "sanitize"           : false,
	    "allowed_tags"       : false,
	    //TODO: Here could open HONORIFICS file and pass them in here I think 
	    "abbreviations"      : null 
	};

	var text = fs.readFileSync(textFile).toString('utf8');
	var sentences = tokenizer.sentences(text, options);
	// console.log("sentences",sentences);
	var sentencesWithLineSpaces=sentences.join("\n\n");
	// console.log("sentencesWithLineSpaces",sentencesWithLineSpaces);

	fs.writeFileSync(outPutSegmentedFile,sentencesWithLineSpaces);
	//TODO: replace the system calls, unix fold, perl etc.. with js modules for segmentations. 

	//TODO: extra manupulation of text 
	//2. The 2nd line (pictured) takes each of sentences (now separated by an empty line) 
	//and places a new line mark at the end of the word that exceeds > 35 characters 
	//(if the sentence exceeds that number)
	//# Break each line at 35 characters
	
	//fold -w 35 -s test2.txt > test3.txt
	var outPutSegmentedFile2 = outPutSegmentedFile+"2.txt";
	exec(`fold -w 35 -s ${outPutSegmentedFile} > ${outPutSegmentedFile2}`, function(error, stdout, stderr) {
		// if(cb){cb(outPutSegmentedFile);}
	    console.log('stdout Segmented Script: ' + stdout);
	    console.log('stderr Segmented Script: ' + stderr);
	    if (error !== null) {
	        console.log('exec error Perl Script: ' + error);
	    }
	    // fs.read
	    // fs.writeFileSync(outPutSegmentedFile2,sentencesWithLineSpaces );
		// if(cb){cb(sourceVideoPath)};
		
		//3. Then the Perl command (3rd line pictured) will take these new chunks 
		//and separate them further so that there are no more than two consecutive lines before an empty line.
		//# Insert new line for every two lines, preserving paragraphs
		// perl -00 -ple 's/.*\n.*\n/$&\n/mg' test3.txt > "$f"
		var outPutSegmentedFile3 = outPutSegmentedFile+"3.txt";
		exec(`perl -00 -ple 's/.*\n.*\n/$&\n/mg' ${outPutSegmentedFile2} > ${outPutSegmentedFile3}`, function(error, stdout, stderr) {
			console.log('stdout Segmented Script: ' + stdout);
		    console.log('stderr Segmented Script: ' + stderr);
		    if (error !== null) {
		        console.log('exec error Perl Script: ' + error);
		    }
			
			if(cb){cb(outPutSegmentedFile3)};

		});

	});







	
}



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

// window.punctuatorPostRequest = punctuatorPostRequest;
//TODO: this could be refactored into 
function punctuatorPostRequest(content, cb){
	var tmpPunctuationFile =sourceVideoPath+".punctuation.txt";  //"~/Desktop/textTEST.txt"
	var comand = `curl -d "text=${content}" http://bark.phon.ioc.ee/punctuator > ${tmpPunctuationFile}`
	exec(comand, function(error, stdout, stderr) {
		var resultTextWithPunctuation = openFile(tmpPunctuationFile);
		if(cb){cb(resultTextWithPunctuation)}
	   	console.log('stdout punctuatorPostRequest: ' + stdout);
	    console.log('stderr punctuatorPostRequest: ' + stderr);
	    if (error !== null) {
	        console.log('exec error: ' + error);
	    }
	});

}

function disableTextEditorProgressMessage(){
	 textEditorContentEditable(false, "<i>Transcription in progress...</i>")
}


function textEditorContentEditable(editable, message){
	if(message){
		textBoxEl.innerHTML = message;
	}	
	textBoxEl.contentEditable = editable;	
}

//TODO: add a button and onclick listener that points to this function 
function resetPunctuation(){
	var text = textBoxEl.innerText;
	// confirm("warning this removes timecodes and current puctuation").
	
	//remove any timecode
	
	// remove any pucntuation . , ! ?
	
	//call punctuator and reset punctuation
	
	//add to text box
}


///Credentials 

 var passwordInput = document.getElementById('password');
  var usernameInput = document.getElementById('username');
  var saveCredentialsBtnEl = document.getElementById('saveCredentialsBtn');

  function getPassword(){
    return passwordInput.value ;
  }

  function getUsername(){
    return usernameInput.value;
  }

  function saveCredentials(){
    alert("saved");
    localStorage.username =  getUsername();
    localStorage.password = getPassword()
  }

  function populateCredentials(){
  		passwordInput.value = window.credentials.password;
  		usernameInput.value = window.credentials.username;
  }

  function loadCredentials(){
    if(localStorage.username && localStorage.password){
       window.credentials = {username: localStorage.username, password: localStorage.password};
    }else{
      // alert("add credentials for ");
      document.getElementById('settingsModalBtnTrigger').click()
    }

  }

  loadCredentials();
  populateCredentials();

  saveCredentialsBtnEl.onclick = function(e){
	e.preventDefault();
	saveCredentials();
};
  // addEventListener("click", saveCredentials);
  // 



///progress line
///
// var sideLine = document.getElementById('progressLineEditor');

// sideLine.onclick = function(e){
// 	var sideLinePosition = sideLine.getBoundingClientRect()
// 	console.log("sideLinePosition",sideLinePosition)
// 	console.log( "sideLinePosition.bottom", sideLinePosition.bottom ," sideLinePosition.top", sideLinePosition.top)
// 	var sideLineLength = sideLinePosition.bottom - sideLinePosition.top;
// 	var mousePositionOnLine = e.clientY - sideLinePosition.top;

// 	console.log("e.clientY",e.clientY);
// 	console.log("sideLineLength",sideLineLength,"mousePositionOnLine",mousePositionOnLine)



// }

//TODO: disable while speech to text 
//textBoxEl.innerHTML = "<i>Transcription in progress...</i>"
//textBoxEl.contentEditable = false
//textBoxEl.contentEditable = true



//to add captions dynamically  - Might not be needed as a requiremen
// maybe add button, update captions preview. or auto trigger. 
// might need to write the `vtt` file. and then code below to update on video.
// altho it better if video was bigger. 
// document.querySelector("video").innerHTML = '<track label="English Captions" srclang="en" kind="captions" src="/Users/pietropassarelli/Dropbox/CODE/NODE/webVideoTextCrawler/test/results.vtt" type="text/vtt" default />'