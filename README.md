# throttle-merge

# Installation

**YARN**

```bash
$ yarn add throttle-merge
```

**NPM**

```bash
$ npm install --save throttle-merge
```

# Usage

```typescript
import ThrottleMerge from 'throttle-merge';

describe('test', () => {
  it('test', async () => {
    const mergedData: number[] = [];

    const throttle = new ThrottleMerge<number, number>({
      executor: (requests) => {
        requests.forEach((request) => {
          mergedData.push(request.data);
          request.resolve(request.data);
        });
      }
    });

    expect(await throttle.request(1)).toBe(1);
    expect(await throttle.request(2)).toBe(2);
    expect(await throttle.request(3)).toBe(3);

    expect(mergedData).toStrictEqual([1, 2, 3]);
    mergedData.splice(0, mergedData.length);

    expect(await throttle.request(4)).toBe(4);
    expect(await throttle.request(5)).toBe(5);
    expect(await throttle.request(6)).toBe(6);

    expect(mergedData).toStrictEqual([4, 5, 6]);
  });
});
```

# License

Apache-2.0
