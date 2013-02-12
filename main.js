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

/*jslint vars: true, plusplus: true, devel: true, nomen: true,  regexp: true, indent: 4, maxerr: 50 */
/*global define, brackets, $, window */

define(function (require, exports, module) {
    "use strict";
    
    var enabled = true,     // Only show preview if true
        //previewMark,        // CodeMirror marker highlighting the preview text
        previewContainer,   // object representing preview iframe
        previewContainerHeight, // calculated by the iframe itself
        previewContainerWidth,
        previewMark,
        currentImagePath;
    
    // var currentImagePreviewContent = "";  // Current image preview content, or "" if no content is showing.
    
    function hidePreview() {
        if (previewMark) {
            previewMark.clear();
            previewMark = null;
        }

        previewContainer.hide();
        previewContainer.call("empty");
        currentImagePath = "";
    }
    
    function positionPreview(xpos, ypos, ybot) {
        var top = ypos - previewContainerHeight - 38;


        if (top < 0) {
            previewContainer.call("orient", "below");
            top = ybot + 16;
            previewContainer.offset({
                left: xpos - previewContainerWidth / 2 - 10,
                top: top
            });
        } else {
            previewContainer.offset({
                left: xpos - previewContainerWidth / 2 - 10,
                top: top
            });
        }
    }
    
    function showPreview(content, xpos, ypos, ybot) {
        hidePreview();
        previewContainer.call("content", content);
        previewContainer.show();
        positionPreview(xpos, ypos, ybot);
    }
    
    function queryPreviewProviders(editor, pos, token, line) {
        
        // TODO: Support plugin providers. For now we just hard-code...
        if (!editor) {
            return;
        }
        
        // Check for gradient
        var gradientRegEx = /-webkit-gradient\([^;]*;?|(-moz-|-ms-|-o-|-webkit-|\s)(linear-gradient\([^;]*);?|(-moz-|-ms-|-o-|-webkit-)(radial-gradient\([^;]*);?/;
        var gradientMatch = line.match(gradientRegEx);
        var prefix = "";
        var colorValue;
        
        // If it was a linear-gradient or radial-gradient variant, prefix with "-webkit-" so it
        // shows up correctly in Brackets.
        if (gradientMatch && gradientMatch[0].indexOf("-webkit-gradient") !== 0) {
            prefix = "-webkit-";
        }
        
        // For prefixed gradients, use the non-prefixed value as the color value. "-webkit-" will be added 
        // before this value
        if (gradientMatch && gradientMatch[2]) {
            colorValue = gradientMatch[2];
        }
        
        // Check for color
        var colorRegEx = /#[a-f0-9]{6}|#[a-f0-9]{3}|rgb\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?\)|rgb\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?\)|rgba\( ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?\b([0-9]{1,2}|1[0-9]{2}|2[0-4][0-9]|25[0-5])\b ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|rgba\( ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?\b([0-9]{1,2}%|100%) ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|hsl\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?\)|hsla\( ?\b([0-9]{1,2}|[12][0-9]{2}|3[0-5][0-9]|360)\b ?, ?\b([0-9]{1,2}|100)\b% ?, ?\b([0-9]{1,2}|100)\b% ?, ?(1|0|0?\.[0-9]{1,3}) ?\)|\baliceblue\b|\bantiquewhite\b|\baqua\b|\baquamarine\b|\bazure\b|\bbeige\b|\bbisque\b|\bblack\b|\bblanchedalmond\b|\bblue\b|\bblueviolet\b|\bbrown\b|\bburlywood\b|\bcadetblue\b|\bchartreuse\b|\bchocolate\b|\bcoral\b|\bcornflowerblue\b|\bcornsilk\b|\bcrimson\b|\bcyan\b|\bdarkblue\b|\bdarkcyan\b|\bdarkgoldenrod\b|\bdarkgray\b|\bdarkgreen\b|\bdarkgrey\b|\bdarkkhaki\b|\bdarkmagenta\b|\bdarkolivegreen\b|\bdarkorange\b|\bdarkorchid\b|\bdarkred\b|\bdarksalmon\b|\bdarkseagreen\b|\bdarkslateblue\b|\bdarkslategray\b|\bdarkslategrey\b|\bdarkturquoise\b|\bdarkviolet\b|\bdeeppink\b|\bdeepskyblue\b|\bdimgray\b|\bdimgrey\b|\bdodgerblue\b|\bfirebrick\b|\bfloralwhite\b|\bforestgreen\b|\bfuchsia\b|\bgainsboro\b|\bghostwhite\b|\bgold\b|\bgoldenrod\b|\bgray\b|\bgreen\b|\bgreenyellow\b|\bgrey\b|\bhoneydew\b|\bhotpink\b|\bindianred\b|\bindigo\b|\bivory\b|\bkhaki\b|\blavender\b|\blavenderblush\b|\blawngreen\b|\blemonchiffon\b|\blightblue\b|\blightcoral\b|\blightcyan\b|\blightgoldenrodyellow\b|\blightgray\b|\blightgreen\b|\blightgrey\b|\blightpink\b|\blightsalmon\b|\blightseagreen\b|\blightskyblue\b|\blightslategray\b|\blightslategrey\b|\blightsteelblue\b|\blightyellow\b|\blime\b|\blimegreen\b|\blinen\b|\bmagenta\b|\bmaroon\b|\bmediumaquamarine\b|\bmediumblue\b|\bmediumorchid\b|\bmediumpurple\b|\bmediumseagreen\b|\bmediumslateblue\b|\bmediumspringgreen\b|\bmediumturquoise\b|\bmediumvioletred\b|\bmidnightblue\b|\bmintcream\b|\bmistyrose\b|\bmoccasin\b|\bnavajowhite\b|\bnavy\b|\boldlace\b|\bolive\b|\bolivedrab\b|\borange\b|\borangered\b|\borchid\b|\bpalegoldenrod\b|\bpalegreen\b|\bpaleturquoise\b|\bpalevioletred\b|\bpapayawhip\b|\bpeachpuff\b|\bperu\b|\bpink\b|\bplum\b|\bpowderblue\b|\bpurple\b|\bred\b|\brosybrown\b|\broyalblue\b|\bsaddlebrown\b|\bsalmon\b|\bsandybrown\b|\bseagreen\b|\bseashell\b|\bsienna\b|\bsilver\b|\bskyblue\b|\bslateblue\b|\bslategray\b|\bslategrey\b|\bsnow\b|\bspringgreen\b|\bsteelblue\b|\btan\b|\bteal\b|\bthistle\b|\btomato\b|\bturquoise\b|\bviolet\b|\bwheat\b|\bwhite\b|\bwhitesmoke\b|\byellow\b|\byellowgreen\b/gi;
        var colorMatch = colorRegEx.exec(line);
        
        var displayColorPreview = function(match, pos) {
            var preview = "<div class='color-swatch-bg'><div class='color-swatch' style='background:" + prefix + (colorValue || match[0]) + ";'></div></div>";
            var startPos = {line: pos.line, ch: match.index},
                endPos = {line: pos.line, ch: match.index + match[0].length};

            editor.charCoords([startPos, endPos]).done(function(startCoords, endCoords) {
                var xPos;
                
                xPos = (endCoords.x - startCoords.x) / 2 + startCoords.x;
                showPreview(preview, xPos, startCoords.y, startCoords.yBot);
                previewMark = editor.markText(
                    startPos,
                    endPos,
                    "preview-highlight"
                );
            });
        };

        var match = gradientMatch || colorMatch;
        while (match) {
            if (match && pos.ch >= match.index && pos.ch <= match.index + match[0].length) {
                displayColorPreview(match, pos);
                return;
            }
            match = colorRegEx.exec(line);
        }
        
        // Check for image name
        var urlRegEx = /url\(([^\)]*)\)/;
        var tokenString;
        var urlMatch = line.match(urlRegEx);
        if (urlMatch && pos.ch >= urlMatch.indx && pos.ch <= urlMatch.index + urlMatch[0].length) {
            tokenString = urlMatch[1];
        } else if (token.className === "string") {
            tokenString = token.string;
        }
        
        if (tokenString) {
            // Strip quotes, if present
            var quotesRegEx = /(\'|\")?([^(\'|\")]*)(\'|\")?/;
            tokenString = tokenString.replace(quotesRegEx, "$2");
            
            if (/(\.gif|\.png|\.jpg|\.jpeg|\.svg)$/i.test(tokenString)) {
                var sPos, ePos;

                // New async API, seems reasonable though
                var docPath = editor.createDocumentRelativeURL(tokenString).done(function(imgPath) {
                    if (urlMatch) {
                        sPos = {line: pos.line, ch: urlMatch.index};
                        ePos = {line: pos.line, ch: urlMatch.index + urlMatch[0].length};
                    } else {
                        sPos = {line: pos.line, ch: token.start};
                        ePos = {line: pos.line, ch: token.end};
                    }
                    
                    if (imgPath) {
                        if (imgPath !== currentImagePath) {
                            editor.charCoords([sPos, ePos]).done(function(sCoords, eCoords) {
                                var xpos = (eCoords.x - sCoords.x) / 2 + sCoords.x;
                                var ypos = sCoords.y;
                                var ybot = sCoords.yBot;
                                
                                // Hide the preview container until the image is loaded.
                                hidePreview();

                                previewContainer.call("showImage", imgPath).done(function(height, width) {
                                    previewContainerHeight = height;
                                    previewContainerWidth = width;
                                    positionPreview(xpos, ypos, ybot);
                                    previewContainer.show();
                                });

                                previewMark = editor.markText(
                                    sPos,
                                    ePos,
                                    "preview-highlight"
                                );
                                currentImagePath = imgPath;
                            });
                        }
                        return;
                    }
                });
            }
        }
        
        hidePreview();
    }

    previewContainer = brackets.view("preview.html");

    brackets.subscribe("hover.css", queryPreviewProviders);
    
    // Add menu command
    var ENABLE_HOVER_PREVIEW      = "Enable Hover Preview";
    var CMD_ENABLE_HOVER_PREVIEW  = "gruehle.enableHoverPreview";

    function updateMenuItemCheckmark() {
        brackets.publish("menu.item.enabled." + CMD_ENABLE_HOVER_PREVIEW, {checked: true});
    }

    function toggleEnableHoverPreview() {
        enabled = !enabled;
        if (!enabled) {
            hidePreview();
        }
        updateMenuItemCheckmark();
    }

    brackets.register("command", CMD_ENABLE_HOVER_PREVIEW, {
        name: ENABLE_HOVER_PREVIEW,
        exec: toggleEnableHoverPreview
    });
    
    brackets.register("menu.item", CMD_ENABLE_HOVER_PREVIEW, {
        name: ENABLE_HOVER_PREVIEW,
        menu: "VIEW_MENU"
    });

    brackets.addEditorCSS('.preview-highlight {\n' +
'    background-color: rgba(200, 200, 150, 0.4);\n' +
'}\n');

    updateMenuItemCheckmark();
});
