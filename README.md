# Captions Maker 

Inspired by [oTranscribe](http://otranscribe.com) and on the back of [textAV](http://textAV.tech) event unconference group.

## Dummy demo 

--->[DEMO](http://pietropassarelli.com/captions-maker/) <----


##  Screenshots and usage

Select a file, for now HTML5 media compatible, `mp4`,`wav`, `webm`, `ogg`, etc..

![caption-maker home screen](docs/img/caption-maker-1.png)

Type or copy and paste from automated service (eg[autoEdit.io](http://autoEdit.io))

![caption-maker text editing](docs/img/caption-maker-2.png)

click `align` to get a preview of an srt file, with clicable timecodes.

![caption-maker srt preview](docs/img/caption-maker-3.png)

Review if anychanges to time and text are needed, and click `export` to save the srt file on the desktop.


###  R&D Resources

- [YouTube Player API Reference for iframe Embeds](https://developers.google.com/youtube/iframe_api_reference)
- [Wait for User to Stop Typing, Using JavaScript](https://schier.co/blog/2014/12/08/wait-for-user-to-stop-typing-using-javascript.html)
- [ ](http://blog.teamtreehouse.com/native-rich-text-editing-with-the-contenteditable-attribute)
- [Jquery/Javascript - Syntax highlighting as user types in contentEditable region
- [Regex and easier approach ](http://pietropassarelli.com/regex.html)

- [](https://stackoverflow.com/questions/13107150/jquery-javascript-syntax-highlighting-as-user-types-in-contenteditable-region)
-[ Aneneas installer installations instructions ](https://github.com/readbeyond/aeneas/blob/master/wiki/INSTALL.md)
-[Aneneas all in one installer release](https://github.com/sillsdev/aeneas-installer/releases)

- [other option to install aeneas (haven't tested)](https://www.npmjs.com/package/aeneas-install)

- [If you need to download youtube videos you can use this other app](https://github.com/pietrop/electron-video-downloader) (could be modified to try and scrape the automatic srt captions as well)

- [electron-quick-start](https://github.com/electron/electron-quick-start)


## TODO
- [x] aenes installation script to run on startup //using external dmg project
	Eg save status in app data folder, eg boolean setupCompleted = true/false
- [ ] Youtubedl import srt
- [x] align/aeneas
	- [ ] perl script to prep alignment //integrated, but not working properly

- [Add support for honorifics](https://github.com/polizoto/segment_transcript/blob/master/HONORIFICS) 


- [ ] add head and tail parameters from input field. with some validation. 
- [ ] add help message on what head and tails refer to (part to ignore at beginning or end, eg if there is music).

- [x] Import video 
	- [ ] move to user tmp folder?

- [ ] convert to audio
- [ ] convert to video
- [ ] STT API (eg baidu?) or youtube scraping etc..

- [ ] support for multiple captioning file formats 

- [ ] add `vtt` track (see if it is possible to update) to preview captions on video element.


- [ ] add punctuaiton button, with warning that removes existing punctuation and then adds new one (?).


- [ ] Error handling if youtube video does not have any transcriptions. add to text editor "Seems like this video does not have any transcriptions".

- [ ] If youtube captions have accurate human captions, display those instead of the automatic once. Find a way to check in results what you get. 

- [ ] youtube captions, language preference.

- [ ] Need to add Error handling and checks for when async operations are happening, eg downloading the video or the captions. 

<!-- Some code notes





//to add captions dynamically  - Might not be needed as a requiremen
// maybe add button, update captions preview. or auto trigger. 
// might need to write the `vtt` file. and then code below to update on video.
// altho it better if video was bigger. 
// document.querySelector("video").innerHTML = '<track label="English Captions" srclang="en" kind="captions" src="/Users/pietropassarelli/Dropbox/CODE/NODE/webVideoTextCrawler/test/results.vtt" type="text/vtt" default />'

 -->
