---
title: Prompt Caching
publish: true
status: draft
category: ai-engineering
tags: [llm, cost]
date: 2026-10-01
updated: 2026-10-01
description: Reusing a stable prompt prefix across requests to cut cost and latency.
---

## Idea

Keep the stable part of a prompt at the start, so the provider can reuse it between calls.

## Notes

Work in progress. Related: [[Rate Limiter]].
