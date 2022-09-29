import * as path from 'path';
import * as util from 'util';
import * as fs from 'fs';
import IfUpdownInterfaces from '../src';

describe('Add interface', () => {
  const samples = ['1', '2', '3'];

  for (let sample of samples) {
    it(`input-${sample}`, async () => {
      const instance = new IfUpdownInterfaces();
      await instance.open(path.join(__dirname, `sample/input-${sample}.txt`));

      instance.addSingleLine('auto', ['vmbr5']);
      instance.addInterface('vmbr5', ['inet', 'manual'], [
        {
          comment: false,
          key: 'address',
          value: '1.1.1.1/24'
        },
        {
          comment: false,
          key: 'ovs_type',
          value: 'OVSBridge'
        },
        {
          comment: false,
          key: 'ovs_ports',
          value: 'eno1 eno2'
        }
      ]);

      const expectedContent = await util.promisify(fs.readFile)(path.join(__dirname, `sample/expected-add_if-${sample}.txt`), { encoding: 'utf8' });
      expect(instance.saveToText()).toEqual(expectedContent);
    });
  }
});
