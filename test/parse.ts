import * as path from 'path';
import IfUpdownInterfaces from '../src';

describe('Parse samples', () => {
  const samples = ['1', '2', '3'];

  for (let sample of samples) {
    it(`input-${sample}`, async () => {
      const instance = new IfUpdownInterfaces();
      await instance.open(path.join(__dirname, `sample/input-${sample}.txt`));
    });
  }
});
