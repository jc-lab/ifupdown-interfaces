# ifupdown-interfaces

# Installation

**YARN**

```bash
$ yarn add ifupdown-interfaces
```

**NPM**

```bash
$ npm install --save ifupdown-interfaces
```

# Usage

```typescript
import IfUpdownInterfaces from 'ifupdown-interfaces';

const instance = new IfUpdownInterfaces();
await instance.open('/etc/network/interfaces');

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

await instance.save();
```

# License

Apache-2.0
