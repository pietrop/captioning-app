# Captioning app. 

Inspired by [oTranscribe](http://otranscribe.com) and on the back of [textAV](http://textAV.tech) event.

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

-----

# electron-quick-start

**Clone and run for a quick way to see Electron in action.**

This is a minimal Electron application based on the [Quick Start Guide](http://electron.atom.io/docs/tutorial/quick-start) within the Electron documentation.

**Use this app along with the [Electron API Demos](http://electron.atom.io/#get-started) app for API code examples to help you get started.**

A basic Electron application needs just these files:

- `package.json` - Points to the app's main file and lists its details and dependencies.
- `main.js` - Starts the app and creates a browser window to render HTML. This is the app's **main process**.
- `index.html` - A web page to render. This is the app's **renderer process**.

You can learn more about each of these components within the [Quick Start Guide](http://electron.atom.io/docs/tutorial/quick-start).

## To Use

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

```bash
# Clone this repository
git clone https://github.com/electron/electron-quick-start
# Go into the repository
cd electron-quick-start
# Install dependencies
npm install
# Run the app
npm start
```

Note: If you're using Linux Bash for Windows, [see this guide](https://www.howtogeek.com/261575/how-to-run-graphical-linux-desktop-applications-from-windows-10s-bash-shell/) or use `node` from the command prompt.

## Resources for Learning Electron

- [electron.atom.io/docs](http://electron.atom.io/docs) - all of Electron's documentation
- [electron.atom.io/community/#boilerplates](http://electron.atom.io/community/#boilerplates) - sample starter apps created by the community
- [electron/electron-quick-start](https://github.com/electron/electron-quick-start) - a very basic starter Electron app
- [electron/simple-samples](https://github.com/electron/simple-samples) - small applications with ideas for taking them further
- [electron/electron-api-demos](https://github.com/electron/electron-api-demos) - an Electron app that teaches you how to use Electron
- [hokein/electron-sample-apps](https://github.com/hokein/electron-sample-apps) - small demo apps for the various Electron APIs

## License

[CC0 1.0 (Public Domain)](LICENSE.md)
