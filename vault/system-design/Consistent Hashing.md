---
title: Consistent Hashing
publish: true
status: complete
category: system-design
tags: [distributed, interview]
date: 2026-09-20
updated: 2026-09-26
description: Spreading keys across nodes with minimal reshuffling when nodes change.
---

## The problem

With `hash(key) % N`, adding or removing a node remaps almost every key.

## The ring

Place nodes and keys on a ring; each key belongs to the next node clockwise. Adding a node only moves the keys between it and its predecessor.

## Virtual nodes

Give each node many positions on the ring to even out the load.

## Used in

Distributed caches, and [[Throttling|rate limiters]] that shard their counters across nodes.
