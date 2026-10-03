---
title: Rate Limiter
publish: true
status: evolving
category: system-design
tags: [redis, scalability, interview]
date: 2026-10-01
updated: 2026-10-03
description: Common rate limiting algorithms and where each fits.
aliases: [Throttling]
---

# Rate Limiter

Protect a service from abuse and noisy neighbours, and keep **latency predictable** under load.

> [!tip] Pick by burst behaviour
> Choose the algorithm by the burst behaviour you want, not by what is easiest to implement.

## Algorithms

- **Token bucket**: allows bursts, refills at a steady rate.
- **Sliding window**: smoother limits at a higher memory cost.

![[rate-limiter-diagram.svg|480]]

```js
const allowed = tokens > 0 // [[not a link]] inside code stays as written
```

> [!warning]
> A fixed window lets a client send double the limit around a window boundary.

> [!note]- Why a Lua script? (click to expand)
> A Lua script makes the read-modify-write on Redis atomic.

## Related

When sharding limiter keys across Redis nodes, see [[Consistent Hashing]]. For the idea behind it, read
[[Consistent Hashing#Virtual nodes|virtual nodes]]. Cost-aware limits are related to [[Prompt Caching]].
A note I have not published yet: [[Distributed Locks]].
