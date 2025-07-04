# dns-check

Quick DNS health check.

## Installation

```sh
npm install @bredele/dns-check
```

## Usage

```ts
import isHealthy from '@bredele/dns-check';

// throw error if broken domain
await isHealthy('example.com');
```
