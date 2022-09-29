import * as fs from 'fs';
import * as util from 'util';
import lodash from 'lodash';

export enum BlockType {
  comment,
  single,
  iface,
}

export interface BlockBase {
  type: BlockType;
  _orig: BlockBase | null;
  text: string;
}

export interface CommentBlock extends BlockBase {
  type: BlockType.comment;
  _orig: CommentBlock | null;
}

export interface SingleLineBlock extends BlockBase {
  type: BlockType.single;
  _orig: SingleLineBlock | null;
  key: string;
  options: string[];
}

export interface Setting {
  comment: boolean;
  key: string;
  value: string;
}

export interface IfaceBlock extends BlockBase {
  type: BlockType.iface;
  _orig: IfaceBlock | null;
  iface: string;
  options: string[];
  settings: Setting[];
}

export type Block = CommentBlock | SingleLineBlock | IfaceBlock;

function blockIsChanged(block: BlockBase): boolean {
  const keys = Object.keys(block)
    .filter(v => v !== '_orig');
  const orig = block._orig as any;
  if (!orig) return true;
  return !keys.reduce((prev, key) => {
    return prev && lodash.isEqual(block[key], orig[key]);
  }, true);
}

export class IfUpdownInterfaces {
  private _filename: string = '';
  private _blocks: Block[] = [];
  private _modifiedBlocks: Block[] = [];

  public open(filename: string): Promise<void> {
    this._filename = filename;
    return util.promisify(fs.readFile)(filename, { encoding: 'utf8' })
      .then((content: string) => {
        try {
          this.readFromText(content);
        } catch (e: any) {
          return Promise.reject(e);
        }
      });
  }

  public readFromText(content: string): void {
    const lines = content.split('\n')
      .map(v => v.trimRight());

    let currentIface: IfaceBlock | null = null;

    this._blocks = [];

    for (let i=0; i<lines.length; i++) {
      const origLine = lines[i];
      const line = origLine.trim();

      // COMMENT
      if (/^#/.test(line) || line.length <= 0) {
        if (currentIface) {
          currentIface.settings.push({
            comment: true,
            key: '',
            value: origLine
          });
          currentIface.text += `\n${origLine}`;
        } else {
          const block: CommentBlock = {
            type: BlockType.comment,
            _orig: null,
            text: origLine
          };
          this._blocks.push(block);
        }
        continue;
      }

      // Single line configuration (not iface)
      let m = /^(auto|source|allow-hotplug)\s+(.+)$/.exec(line);
      if (m) {
        const block: SingleLineBlock = {
          type: BlockType.single,
          _orig: null,
          text: origLine,
          key: m[1],
          options: m[2].split(' ').map(v => v.trim())
        };
        this._blocks.push(block);
        currentIface = null;
        continue;
      }

      // iface
      m = /^iface\s+([^ ]+)\s+(.+)$/.exec(line);
      if (m) {
        const iface = m[1];

        const block: IfaceBlock = {
          type: BlockType.iface,
          _orig: null,
          text: origLine,
          iface,
          options: m[2].split(' ').map(v => v.trim()),
          settings: []
        };

        this._blocks.push(block);
        currentIface = block;
        continue;
      }

      if (currentIface) {
        m = /^([^ ]+)\s+(.+)$/.exec(line);
        if (m) {
          currentIface.settings.push({
            comment: false,
            key: m[1],
            value: m[2]
          });
          currentIface.text += `\n${origLine}`;
        }
        continue;
      }

      throw new Error('PARSE FAILED: ' + line);
    }

    this._blocks.forEach((block) => {
      block._orig = lodash.cloneDeep(block);
    });
    this._modifiedBlocks = lodash.cloneDeep(this._blocks);
  }

  public saveToText(): string {
    return this._modifiedBlocks.map((block) => {
      if (blockIsChanged(block)) {
        if (block.type === BlockType.single) {
          return block.key + ' ' + block.options.join(' ');
        } else if (block.type === BlockType.iface) {
          return `iface ${block.iface} ${block.options.join(' ')}\n` +
            block.settings
              .map((setting) => {
                if (setting.comment) {
                  return `    ${setting.value}`;
                } else {
                  return `    ${setting.key} ${setting.value}`;
                }
              })
              .join('\n');
        } else {
          return block.text;
        }
      } else {
        return block.text;
      }
    })
      .join('\n');
  }

  public save(filename?: string | undefined): Promise<void> {
    const data = this.saveToText();
    return util.promisify(fs.writeFile)(filename || this._filename, data);
  }

  public get blocks(): Block[] {
    return this._modifiedBlocks;
  }

  public findInterface(iface: string): IfaceBlock | null {
    return this._modifiedBlocks.find(v => v.type === BlockType.iface && v.iface === iface) as any;
  }

  public addSingleLine(key: string, options: string[]): void {
    this._modifiedBlocks.push({
      type: BlockType.single,
      _orig: null,
      key,
      options: options,
      text: ''
    });
  }

  public addInterface(iface: string, options: string[], settings: Setting[]): void {
    this._modifiedBlocks.push({
      type: BlockType.iface,
      _orig: null,
      iface,
      options,
      settings,
      text: ''
    });
  }
}

export default IfUpdownInterfaces;
