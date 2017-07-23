const electron = require('electron');
// Module to control application life.
const app = electron.app;
const Menu = electron.Menu;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const shellescape = require('shell-escape');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 900})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

   mainWindow.dataPath = app.getAppPath()+"/tmp";//.getPath("appData");
   mainWindow.app = app;

    mainWindow.desktopPath = app.getPath("desktop");
    // mainWindow.desktopPath = desktopPath;


 // MENU
 // Create the Application's main menu
    var template = [{
        label: "Application",
        submenu: [
            { label: "About Application", selector: "orderFrontStandardAboutPanel:" },
            { type: "separator" },
            { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
        ]}, {
        label: "Edit",
        submenu: [
            { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
            { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
            { type: "separator" },
            { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
            { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
            { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
            {role: 'pasteandmatchstyle'},
            {role: 'delete'},
            { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" },
            {type: 'separator'},
            {label: 'Speech',
              submenu: [
                {role: 'startspeaking'}, //perhaps add keyboard shortcut?
                {role: 'stopspeaking'} //perhaps add keyboard shortcut?
              ]}
        ]},{
        label: 'View',
        submenu: [
          {role: 'reload'},
          {role: 'forcereload'},
          {role: 'toggledevtools', accelerator: "CmdOrCtrl+Alt+I"},
          {type: 'separator'},
          {role: 'resetzoom'},
          {role: 'zoomin'},
          {role: 'zoomout'},
          {type: 'separator'},
          {role: 'togglefullscreen'}
        ]},{
        role: 'window',
        submenu: [
          {role: 'minimize'},
          {role: 'close'}
        ]},{
        role: 'help',
        submenu: [
          {
            label: 'Project Page',
            click () { require('electron').shell.openExternal('https://github.com/pietrop/Caption_Maker') }
          },
          {
            label: 'User Manual',
            click () { require('electron').shell.openExternal('https://github.com/pietrop/Caption_Maker') }
          }
        ]}
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));


   //to open external url with default browser by default. 
   mainWindow.webContents.on('new-window', function(e, url) {
    e.preventDefault();
    require('electron').shell.openExternal(url);
  });

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
