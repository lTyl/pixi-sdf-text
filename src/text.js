let Mesh = PIXI.mesh.Mesh;
let loadFont = require('load-bmfont');
let createLayout = require('layout-bmfont-text');
let createIndices = require('quad-indices');
let vertices = require('./lib/vertices');
import TextStyle from './text-style';

import * as shaderCode from './sdf.frag';

export default class Text extends PIXI.mesh.Mesh {

    constructor(text, style = {}) {

        super(style.texture);

        this.style = new TextStyle(style);
        this._text = text;

        this.pluginName = 'sdf';

        this.loadAssets();
    }

    loadAssets() {
        loadFont(this.style.fontURL, (err, font) => {

            this._font = font;
			if (!PIXI.utils.TextureCache[this.style.imageURL]){
				PIXI.loader.add(this.style.imageURL, this.style.imageURL).load((loader, resources) => {
					this._texture = resources[this.style.imageURL].texture;
					this.updateText();
				});
            }
        });
    }

    updateText() {

        let opt = {
            text: this._text,
            font: this._font,
			align: this.style.align,
			fontSize: this.style.fontSize,
			fill: this.style.fill,
			fontWeight: this.style.fontWeight,
			width: this.style.wordWrapWidth,
			wordWrapWidth: this.style.wordWrapWidth,
			lineHeight: this.style.lineHeight
        };

        if (!opt.font) {
            throw new TypeError('must specify a { font } in options');
        }

        this.layout = createLayout(opt);

        // get vec2 texcoords
        let flipY = opt.flipY !== false;

        // the desired BMFont data
        let font = opt.font;

        // determine texture size from font file
        let texWidth = font.common.scaleW;
        let texHeight = font.common.scaleH;

        // get visible glyphs
        let glyphs = this.layout.glyphs.filter(function (glyph) {
            let bitmap = glyph.data;
            return bitmap.width * bitmap.height > 0;
        })

        // provide visible glyphs for convenience
        this.visibleGlyphs = glyphs;

        // get common vertex data
        let positions = vertices.positions(glyphs);
        let uvs = vertices.uvs(glyphs, texWidth, texHeight, false);

        this.indices = createIndices({
            clockwise: true,
            type: 'uint16',
            count: glyphs.length
        });

        this.vertices = new Float32Array(positions);
        this.uvs = new Float32Array(uvs);

        this.styleID = this.style.styleID;
        this.dirty++;
        this.indexDirty++;
    }

    get text() {
        return this._text;
    }

    set text(value) {
        this._text = value;
        this.updateText();
    }
}