---
title: Queues and Horizon
publish: true
status: complete
category: laravel
tags: [queues, redis]
date: 2026-09-15
updated: 2026-09-28
description: Running background jobs in Laravel and monitoring them with Horizon.
---

## Why queues

Move slow work (mail, exports, webhooks) out of the request cycle.

## Horizon

Horizon supervises Redis queues and gives you a dashboard for throughput, failures and wait times.
