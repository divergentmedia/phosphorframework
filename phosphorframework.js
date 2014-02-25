/*!
 * Phosphor Framework 1.0.2
 * http://www.divergentmedia.com/phosphor
 *
 * Copyright 2013, divergent media, inc.
 * Licensed under the MIT license.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */

(function() {
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

// version: https://gist.github.com/raw/1579671/7f515ade253afbc860dac1f84e21998d54359d79/rAF.js
    
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function PhosphorPlayer(bindto_id){
    
    var self = this;
    this.bindId = bindto_id;
    this.frameworkVersion = 1;

    var Base64BitStream = function(inputString) {
        var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var _bytePosition = 0;
        var _bitPosition = 0;
        var _byteArray = [];
        
        var setInputString = function(input) {
            if(!input) return;
            var byte1, byte2, byte3,
            enc1, enc2, enc3, enc4,
            i = 0,
            j = 0,
            bytes = (input.length/4) * 3;
            
            for (i=0; i<bytes; i+=3) {
                
                //get the 3 octects in 4 ascii chars
                enc1 = _keyStr.indexOf(input.charAt(j++));
                enc2 = _keyStr.indexOf(input.charAt(j++));
                enc3 = _keyStr.indexOf(input.charAt(j++));
                enc4 = _keyStr.indexOf(input.charAt(j++));
                
                byte1 = (enc1 << 2) | (enc2 >> 4);
                byte2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                byte3 = ((enc3 & 3) << 6) | enc4;
                
                _byteArray.push(byte1);
                _byteArray.push(byte2);
                _byteArray.push(byte3);
            }
        };
        
        var _updatePositions = function() {
            //reset all out bit/byte positions
            while ( _bitPosition < 0){
                _bytePosition--;
                _bitPosition += 8;
            }
            
            while ( _bitPosition > 7){
                _bytePosition++;
                _bitPosition -= 8;
            }
        };
        
        var readByte = function() {
            var result = readBits(8);
            return result;
        };
        
        var readBytes = function(byteCount) {
            var accumulator = 0, i;
            for(i=0; i < byteCount; i++) {
                accumulator = (accumulator << 8) + readByte();
            }
            return accumulator;
        };
        
        var readBits = function(bitCount) {
            var accumulator = 0;
            
            if(bitCount > 8) {
                accumulator += readBits(8) << (bitCount - 8);
                bitCount -= 8;
            }
            
            if((_bitPosition + bitCount) > 8){
                var firstBitsLength = 8 - _bitPosition;
                accumulator += readBits(firstBitsLength) << (bitCount - firstBitsLength);
                bitCount -= firstBitsLength;
            }
            
            var leftShift = 8 - bitCount - _bitPosition;
            var bitMask = 0xFF >> (8 - bitCount);
            bitMask = bitMask << leftShift;
            
            var bits = _byteArray[_bytePosition] & bitMask;
            
            accumulator += (bits >> leftShift);
            
            _bitPosition += bitCount;
            
            //reset all out bit/byte positions
            _updatePositions();
            
            return accumulator;
        };
        
        var skipBytes = function(byteCount) {
            _bytePosition += byteCount;
        };
        
        var skipBits = function(bitCount) {
            _bitPosition += bitCount;
            _updatePositions();
        };
        
        var eof = function() {
            return (_bytePosition >= _byteArray.length);
        };
        
        var bytePos = function() {
            return _bytePosition;
        };
        
        var jumpToOffsetByteBits = function(byteoffset, bitoffset) {
            _bytePosition = byteoffset;
            _bitPosition = bitoffset;
            _updatePositions();
        };
        
        var byteLength = function() {
            return _byteArray.length;
        };
        
        //do the class init
        setInputString(inputString);
        
        return {
            readByte : readByte,
            readBytes : readBytes,
            readBits : readBits,
            skipBytes : skipBytes,
            skipBits : skipBits,
            eof : eof,
            bytePos : bytePos,
        jumpToOffsetByteBits: jumpToOffsetByteBits,
        byteLength: byteLength
        };
    };
    
    this._debug = false;
    this._canvas = null;
    this._imgArray = [];
    this._animationId = -1;
    this._currentFrameNumber = 0;
    this._frameCount = 0;
    this._loop = false;
    this._jsonData = null;
    this._atlasImagetheresLoaded = false;
    this._onLoadHandler = "";
    this._currentFrameCallback = null;
    this._playbackFinishedCallback = null;
    
    
    var alertFrameworkVersion = function(compVersion) {
        var ctx = self._canvas.getContext('2d');
        var alertText = "Phosphor Framework Version Mismatch!";
        var metrics = ctx.measureText(alertText);
        ctx.fillStyle = "red";
        ctx.fillRect(self._canvas.width/2 - metrics.width/2 - 5,self._canvas.height/2 - 20,metrics.width+25, 30);
        ctx.fillStyle = "white";
        ctx.font = "normal 12px Letter Faces";
        ctx.fillText(alertText, self._canvas.width/2 - metrics.width/2, self._canvas.height/2);
        console.log(alertText + " Confirm that your phosphor framework is the same or newer than the composition.  Composition version: " + compVersion + ", framework version: " + self.frameworkVersion);
    };
    
    var _doFrameBlits = function(blits, clearBeforeBlitting, debugBlits)
    {
        debugBlits = (typeof debugBlits === "undefined") ? false : debugBlits;
        var ctx = self._canvas.getContext('2d');
        var isIFrame = false;
        
        var bitStream = Base64BitStream(blits);
        
        if(bitStream){
            
            while((bitStream.byteLength() - bitStream.bytePos()) > 10){
                
                //pps
                bitStream.skipBytes(1); //version
                var imgindex = bitStream.readByte();
                var blockSize = bitStream.readBits(5);
                var frameType = bitStream.readBits(3);
                var blitArrayByteCount = bitStream.readBytes(2);
                
                var srcXYBitDepth = bitStream.readBits(4);
                var destXBitDepth = bitStream.readBits(4);
                var destYBitDepth = bitStream.readBits(4);
                var srcWidthBitDepth = bitStream.readBits(4);
                var srcHeightBitDepth = bitStream.readBits(4);
                var destWidthBitDepth = bitStream.readBits(4);
                var destHeightBitDepth = bitStream.readBits(4);
                
                bitStream.skipBits(52); //reserved
                
                
                //clear the frame if we are an iframe (much faster than clearing each blit)
                if(frameType === 0 && !isIFrame){
                    isIFrame = true;
                    var displayWidth = self._jsonData.framesize.width;
                    var displayHeight = self._jsonData.framesize.height;
                    ctx.clearRect(0, 0, displayWidth, displayHeight);
                }
                
                var offset = bitStream.bytePos();
                
                for(var i = 0; i < blitArrayByteCount; i++)
                {
                    
                    var sx = bitStream.readBits(srcXYBitDepth) * blockSize;
                    var sy = bitStream.readBits(srcXYBitDepth) * blockSize;
                    
                    var w1 = 1 * blockSize;
                    var h1 = 1 * blockSize;
                    if(srcWidthBitDepth > 0){
                        w1 = (bitStream.readBits(srcWidthBitDepth) + 1) * blockSize;
                    }
                    if(srcHeightBitDepth > 0){
                        h1 = (bitStream.readBits(srcHeightBitDepth) + 1) * blockSize;
                    }
                    
                    var dx = bitStream.readBits(destXBitDepth) * blockSize;
                    var dy = bitStream.readBits(destYBitDepth) * blockSize;
                    
                    var w2 = w1;
                    var h2 = h1;
                    if(destWidthBitDepth > 0){
                        w2 = (bitStream.readBits(destWidthBitDepth) + 1) * blockSize;
                    }
                    if(destHeightBitDepth > 0){
                        h2 = (bitStream.readBits(destHeightBitDepth) + 1) * blockSize;
                    }
                    
                    //clear the blit if we are a pframe
                    if(frameType == 1 && clearBeforeBlitting){
                        ctx.clearRect(dx, dy, w2, h2);
                    }

                    ctx.drawImage(self._imgArray[imgindex], sx, sy, w1, h1, dx, dy, w2, h2);
                    
                    if(debugBlits){
                        ctx.lineWidth="1";
                        ctx.strokeStyle="red";
                        ctx.strokeRect(dx+1,dy+1,w2-2,h2-2);
                    }
                }
            }
        }
        
        
    };
    
    var animate = function()
    {
        var metadata = self._jsonData;
        var dataVersion = metadata.version;
        
        var ctx = self._canvas.getContext('2d');
        if(dataVersion > self.frameworkVersion) {
            alertFrameworkVersion(dataVersion);
            return;
        }
        
        var clearBeforeBlitting = metadata.hasAlpha;
        
        var lastTime = 0;
        var frameDelay = 0;

        var f = function(now)
        {
            var frames = metadata.frames;

            if (self._animationId === -1) return;

            if (lastTime > 0 && (now - lastTime < frameDelay)) {
                requestAnimationFrame(f);
                return;
            }
            
            if(self._debug){
                var lastFrameBlits = frames[self._currentFrameNumber - 1];
                if(lastFrameBlits){
                    _doFrameBlits(lastFrameBlits.x, clearBeforeBlitting);
                }
            }
            
            var blits = frames[self._currentFrameNumber];
            if(blits){
                var frameduration = blits.d;
                _doFrameBlits(blits.x, clearBeforeBlitting, self._debug);
            }
            
            if(self._currentFrameCallback) {
                if(blits && blits.hasOwnProperty("m")) {
                    self._currentFrameCallback(self._currentFrameNumber, blits.m);
                }
                else {
                    self._currentFrameCallback(self._currentFrameNumber, null);
                }
                
            }
            
            if(!self._pingPong){
                self._currentFrameNumber++;
                if(self._currentFrameNumber == frames.length){

                    if(self._playbackFinishedCallback) {
                        self._playbackFinishedCallback();
                    }

                    if(self._loop){
                        self._currentFrameNumber = 0;
                        now = 0;
                    }else{
                        return;
                    }
                }
            }
            else{
                if(self._playbackDirection == 1){

                    if(self._currentFrameNumber == frames.length){
                        self._playbackDirection = -1;
                    }else{
                        self._currentFrameNumber++;
                    }

                }else{

                    if(self._currentFrameNumber == 0){
                        self._playbackDirection = 1;
                    }else{
                        self._currentFrameNumber--;
                    }
                }
            }
            
            frameDelay = frameduration * 1000 / metadata.timescale;
            lastTime = now;
            self._animationId = requestAnimationFrame(f);
            
        };

        self._animationId = requestAnimationFrame(f);
    };
    
    var drawCurrentFrame = function()
    {
        var metadata = self._jsonData;
        var dataVersion = metadata.version;
        
        var ctx = self._canvas.getContext('2d');
        
        if(dataVersion > self.frameworkVersion) {
            alertFrameworkVersion(dataVersion);
            return;
        }
        
        var clearBeforeBlitting = metadata.hasAlpha;
        var displayWidth = metadata.framesize.width;
        var displayHeight = metadata.framesize.height;
        
        var frames = metadata.frames;
        
        if(clearBeforeBlitting){
            ctx.clearRect(0, 0, displayWidth, displayHeight);
        }
        
        var blits = frames[self._currentFrameNumber];
        var frameduration = blits.d;
        _doFrameBlits(blits.x, clearBeforeBlitting, self._debug);
        
    };
    
    this.load_animation = function(parameters)
    {
        self._atlasImagesLoaded = false;
        self.img_urls = parameters.imageArray;
        self.img_path = parameters.imagePath;
        self._onLoadHandler = parameters.onLoad;
        self._loop = parameters.loop;
        self._pingPong = parameters.pingPong;
        self._playbackDirection = 1;
        self._currentFrameCallback = parameters.currentFrameCallback;
        self._playbackFinishedCallback = parameters.playbackFinishedCallback;
        self.loadOneImage = function() {
            if(self.img_urls.length > 0){
                
                var img = new Image();
                img.onload = function() {
                    self._imgArray.push(img);
                    self.loadOneImage();
                };

                if(self.img_path && self.img_path.length>0) {
                    img.src = self.img_path + self.img_urls.shift();
                }
                else {
                    img.src = self.img_urls.shift();
                }
            }else{
                self._atlasImagesLoaded = true;
                self._onLoadHandler();
                return;
            }
        };
        self.loadOneImage();
        
        self._jsonData = parameters.animationData;
        self._frameCount = self._jsonData.frames.length;
        
    };
    
    this.play = function()
    {
        if (self._animationId !== -1) {
            return;
        }

        if (self._canvas && self._canvas.getContext && self._jsonData && self._atlasImagesLoaded) {
            animate();
        }
        else {
            setTimeout(function(){ self.play(); }, 100);
        }
        
    };
    
    this.stop = function()
    {
        if (self._animationId === -1) {
            return;
        }

        cancelAnimationFrame(self._animationId);
        self._animationId = -1;
    };
    
    this.currentFrameNumber = function()
    {
        return self._currentFrameNumber;
    };
    
    this.setCurrentFrameNumber = function(frameNum)
    {
        self._currentFrameNumber = frameNum;
        drawCurrentFrame();
    };
    
    this.debug = function(setdebug)
    {
        self._debug = setdebug;
    };
    
    this.loop = function (setLoop) {
        self._loop = setLoop;
    };
    
    var _bind = function(img_id)
    {
        var imgdiv = document.getElementById(img_id);
        var parent = imgdiv.parentNode;
        
        self._canvas = document.createElement('canvas');
        
        var canvascheck=(self._canvas.getContext)? true : false
        if(!canvascheck) {
            return false;
        }
        
        self._canvas.id = imgdiv.id;
        self._canvas.style.cssText = 'display:block;';
        
        if(imgdiv.complete) {
            self._canvas.width = imgdiv.width;
            self._canvas.height = imgdiv.height;            

            parent.replaceChild(self._canvas,imgdiv);
            var context = self._canvas.getContext("2d");
            context.drawImage(imgdiv, 0,0);
        }
        else {
            imgdiv.onload = function() {
                self._canvas.width = imgdiv.width;
                self._canvas.height = imgdiv.height;

                parent.replaceChild(self._canvas,imgdiv);
                var context = self._canvas.getContext("2d");
                context.drawImage(imgdiv, 0,0);
            };
        }


    };
    
    _bind(bindto_id);
    
}
