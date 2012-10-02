/*
 * Copyright (c) 2012 Glenn Ruehle
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window, tinycolor */

define(function (require, exports, module) {
    "use strict";
    
    // Constants
    var HOVER_TIMEOUT = 250;
    
    // Brackets modules
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils");
    
    var mouseMoveTimeout,   // ID of mouse move timeout
        previewMark,        // CodeMirror marker highlighting the preview text
        $previewContainer;  // Preview container
    
    function hidePreview() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }
        $previewContainer.empty();
        $previewContainer.hide();
    }
    
    function showPreview(content, xpos, ypos) {
        hidePreview();
        $previewContainer.append(content);
        $previewContainer.show();
        $previewContainer.offset({
            left: xpos - $previewContainer.width() / 2 - 10,
            top: ypos - $previewContainer.height() - 38
        });
    }
    
    function timeoutHandler(event) {
        mouseMoveTimeout = null;
    }
    
    function divContainsMouse($div, event) {
        var offset = $div.offset();
        
        return (event.clientX >= offset.left &&
                event.clientX <= offset.left + $div.width() &&
                event.clientY >= offset.top &&
                event.clientY <= offset.top + $div.height());
    }
    
    function showPreviewForToken(token, line, event) {
        if (token && token.string && token.className) {
            showPreview(line + token.string + "," + token.className, event.clientX, event.clientY);
        } else {
            hidePreview();
        }
    }
    
    function queryPreviewProviders(editor, pos, token, line, event) {
        
        // TODO: Support plugin providers. For now we just hard-code...
        
        // Check for color
        var colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b(1|0|0\.[0-9]{1,3}) ?\)/i;
        var match = line.match(colorRegEx);
        if (match && pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
            var cm = editor._codeMirror;
            var preview = "<div class='color-swatch' style='background:" + match[0] + ";'></div>";
            var startPos = {line: pos.line, ch: match.index},
                endPos = {line: pos.line, ch: match.index + match[0].length},
                startCoords = cm.charCoords(startPos),
                xPos;
            
            xPos = (cm.charCoords(endPos).x - startCoords.x) / 2 + startCoords.x;
            showPreview(preview, xPos, startCoords.y);
            previewMark = cm.markText(
                {line: pos.line, ch: match.index},
                {line: pos.line, ch: match.index + match[0].length},
                "preview-highlight"
            );
            return;
        }
        
        hidePreview();
        // showPreviewForToken(token, line, event);
    }
    
    function handleMouseMove(event) {
        /*
        // Clear existing timeout
        if (mouseMoveTimeout) {
            window.clearTimeout(mouseMoveTimeout);
            mouseMoveTimeout = null;
        }
        
        // Set new timeout
        mouseMoveTimeout = window.setTimeout(timeoutHandler, HOVER_TIMEOUT);
        */
        
        // Figure out which editor we are over
        var fullEditor = EditorManager.getCurrentFullEditor();
        
        if (!fullEditor) {
            hidePreview();
            return;
        }
        
        // Check inlines first
        var inlines = fullEditor.getInlineWidgets(),
            i,
            editor;
        
        for (i = 0; i < inlines.length; i++) {
            var $inlineDiv = inlines[i].$editorsDiv;
            
            if (divContainsMouse($inlineDiv, event)) {
                editor = inlines[i].editors[0];
                break;
            }
        }
        
        // Check main editor
        if (!editor) {
            if (divContainsMouse($(fullEditor._codeMirror.getWrapperElement()), event)) {
                editor = fullEditor;
            }
        }
        
        if (editor) {
            var cm = editor._codeMirror;
            var pos = cm.coordsChar({x: event.clientX, y: event.clientY});
            var token = cm.getTokenAt(pos);
            var line = cm.getLine(pos.line);
            
            queryPreviewProviders(editor, pos, token, line, event);
        } else {
            hidePreview();
        }
    }
    
    // Init: Listen to all mousemoves in the editor area
    $("#editor-holder")[0].addEventListener("mousemove", handleMouseMove, true);
    
    // Create the preview container
    $previewContainer = $("<div id='hover-preview-container' class='preview-bubble'>").appendTo($("body"));
    
    // Load our stylesheet
    ExtensionUtils.loadStyleSheet(module, "HoverPreview.css");
    
    // TODO: Add command/keyboard shortcut for showing preview at the current cursor location
});