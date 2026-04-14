'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   database/db.js — Zero-dependency JSON file store
   No native compilation required. Data stored as pretty-printed JSON files
   in the Electron userData directory.
   ═══════════════════════════════════════════════════════════════════════════ */

const fs   = require('fs');
const path = require('path');

// ─── Full Roadmap Seed Data (28 Nodes, ~1278 total hours) ─────────────────
const SEED_NODES = [
  // ══════ PHASE 0 ══════════════════════════════════════════════════════════
  {
    id:'P0N1', phase:0, order:1, difficulty:'Medium', hours:8,
    title:'Setting the Forge',
    description:'Setup the perfect Windows 11 Dev Environment.\n\n• WSL2 + Ubuntu 22.04 LTS\n• VSCode / PyCharm with optimal extensions (Pylance, Ruff, GitLens, REST Client)\n• Git configuration, SSH keys, GPG signing\n• Python 3.12 via pyenv, virtualenv workflow\n• PostgreSQL 16, Redis, Docker Desktop\n• Windows Terminal with Starship prompt\n• Automate with a dotfiles repository on GitHub',
    hardcore:'Configure a custom Starship prompt showing git status, Python version, and active virtualenv. Commit your dotfiles to a public GitHub repo. Time yourself: can you spin up a fresh Django dev environment in under 10 minutes?',
    dod:'✓ Full Django + PostgreSQL + Redis stack spins up from scratch in < 10 minutes\n✓ Dotfiles repo public on GitHub\n✓ Custom terminal prompt configured',
    prereqs:'',
  },
  {
    id:'P0N2', phase:0, order:2, difficulty:'Medium', hours:40,
    title:'DSA Initial Assessment (Codeforces Bronze)',
    description:'Establish your baseline. Solve 50 Codeforces problems rated 1000–1200 focused on implementation, basic math, simulation, and greedy.\n\n• Problems: A/B from Div. 3, Div. 4 rounds\n• Topics: modular arithmetic, simple arrays, string manipulation, brute force\n• Review the entire USACO Guide Bronze section',
    hardcore:'Attempt a full live Codeforces Div. 3 round. For every problem you fail, solve it within 24 hours and perform an in-depth post-mortem analysis.',
    dod:'✓ 50 Codeforces problems solved (1000–1200 range)\n✓ USACO Bronze guide completely reviewed\n✓ Comfortably solving 3 problems within a Div. 3 time limit',
    prereqs:'P0N1',
  },
  {
    id:'P0N3', phase:0, order:3, difficulty:'Medium', hours:30,
    title:'Python Core Reinforcement',
    description:'Python fundamentals at expert level.\n\n• Built-in types: list, dict, set, tuple, frozenset\n• Comprehensions: list, dict, set, generator\n• Built-in functions: map, filter, zip, enumerate, sorted, any, all\n• Standard libraries: collections (Counter, defaultdict, deque), itertools, functools, heapq, bisect, math\n• String internals and formatting\n• File I/O and context managers',
    hardcore:'Implement these 10 algorithms from memory with zero syntax errors: BFS, DFS (recursive + iterative), Binary Search, QuickSort, MergeSort, Dijkstra (basic), KMP String Search, Sieve of Eratosthenes, Union-Find (with path compression), Trie (insert/search).',
    dod:'✓ All 10 algorithms implemented from memory\n✓ Any LeetCode Easy problem solved in under 10 minutes\n✓ heapq, bisect, collections mastered with 5 practical examples each',
    prereqs:'P0N1',
  },
  // ══════ PHASE 1 ══════════════════════════════════════════════════════════
  {
    id:'P1N1', phase:1, order:1, difficulty:'Medium', hours:20,
    title:'Foundations of Complexity',
    description:'Master algorithmic analysis before writing a single line of competitive code.\n\n• Big O, Big Omega, Big Theta notation\n• Amortized analysis (dynamic array, hash table)\n• Worst-case vs. average-case vs. best-case\n• Python built-in complexity analysis: list.append O(1) amortized, dict lookup O(1) avg\n• Recurrence relations (Master Theorem)\n• Space complexity analysis',
    hardcore:'Derive the time complexity of Python\'s TimSort from first principles. Explain why hash table average-case is O(1) by tracing Python\'s dict implementation.',
    dod:'✓ Can state complexity of any standard operation across all Python built-ins without hesitation\n✓ Can back complexity claims with mathematical reasoning\n✓ Solved 10 complexity-analysis exercises',
    prereqs:'P0N2,P0N3',
  },
  {
    id:'P1N2', phase:1, order:2, difficulty:'Hard', hours:30,
    title:'Sorting & Searching (USACO Silver)',
    description:'Go beyond knowing sorting exists — understand every algorithm deeply.\n\n• Binary Search: on sorted arrays, on answer (parametric search)\n• Ternary Search: on unimodal functions\n• QuickSort/MergeSort internals, Counting Sort, Radix Sort\n• Python TimSort: custom sort keys, comparators via functools.cmp_to_key\n• USACO Silver: binary search on answer pattern',
    hardcore:'Implement Ternary Search to find minimum of f(x) = (x-3)² + 5 to 6 decimal places. Solve 5 USACO Silver problems requiring binary search on the answer.',
    dod:'✓ All sorting algorithms implemented from scratch\n✓ 5 USACO Silver binary-search-on-answer problems solved\n✓ Can identify "binary search on answer" pattern in novel problems',
    prereqs:'P1N1',
  },
  {
    id:'P1N3', phase:1, order:3, difficulty:'Hard', hours:35,
    title:'Linear Data Structures',
    description:'Build every structure from scratch — no built-ins allowed.\n\n• Singly & Doubly Linked Lists (insert, delete, reverse, cycle detection)\n• Stack: array-based and linked-list-based\n• Queue: circular buffer implementation\n• Deque: from scratch using circular buffer\n• Monotonic Stack: Next Greater Element, Largest Rectangle in Histogram\n• Monotonic Queue: Sliding Window Maximum',
    hardcore:'Implement a full Deque from scratch using a circular buffer (O(1) all operations). Then solve "Sliding Window Maximum" using a Monotonic Deque. Solve 10 monotonic stack/queue problems.',
    dod:'✓ All structures implemented from scratch, tested with edge cases\n✓ 10 monotonic stack/queue problems solved\n✓ Can trace through Floyd\'s cycle detection algorithm for any linked list',
    prereqs:'P1N1',
  },
  {
    id:'P1N4', phase:1, order:4, difficulty:'Hard', hours:40,
    title:'Non-Linear Data Structures (Silver)',
    description:'Trees, heaps, and hash maps — the backbone of all advanced algorithms.\n\n• Binary Search Trees: insert, delete, search, in-order traversal\n• AVL/Red-Black Trees: conceptual understanding\n• Binary Heap: min-heap and max-heap from scratch\n• Hash Maps: chaining vs. open addressing, load factor, rehashing\n• Trie (Prefix Tree): insert, search, startsWith, autocomplete',
    hardcore:'Implement a min-heap from scratch: insert, extract_min, heapify_up, heapify_down. Implement a Trie supporting: insert, search, delete, autocomplete (returns all words with prefix).',
    dod:'✓ Binary Heap implemented from scratch with all operations\n✓ Trie with autocomplete implemented\n✓ 10 heap/trie problems solved',
    prereqs:'P1N2,P1N3',
  },
  {
    id:'P1N5', phase:1, order:5, difficulty:'Hard', hours:50,
    title:'Prefix Sum & Two-Pointers Mastery',
    description:'The bread and butter of USACO Silver.\n\n• 1D Prefix Sums: range sum queries in O(1)\n• 2D Prefix Sums: rectangle sum queries in O(1)\n• Difference Arrays: range update in O(1)\n• Sliding Window: fixed and variable size\n• Two Pointers: sorted array problems\n• USACO Silver specific techniques: solving 30 problems',
    hardcore:'Solve 30 USACO Silver problems using Prefix Sum and Two-Pointer techniques. Include at least 5 problems requiring 2D prefix sums.',
    dod:'✓ 30 USACO Silver problems solved\n✓ 2D prefix sum formula derived from first principles\n✓ Can solve any sliding window problem in O(n) without hints',
    prereqs:'P1N2,P1N3',
  },
  // ══════ PHASE 2 ══════════════════════════════════════════════════════════
  {
    id:'P2N1', phase:2, order:1, difficulty:'Hard', hours:40,
    title:'Advanced Python: Under the Hood',
    description:'Move from Python user to Python expert.\n\n• Generators & Iterators: __iter__/__next__, send(), yield from\n• Decorators: functools.wraps, class-based, decorator factories\n• Context Managers: __enter__/__exit__, contextlib\n• Metaclasses: __new__ vs __init__, type(), custom metaclass applications\n• Memory Management: reference counting, gc module, weak references, __slots__\n• The GIL: what it is, why it exists, threading vs. multiprocessing\n• asyncio: event loop, coroutines, Tasks, gather, Semaphore, Lock',
    hardcore:'Write a @retry(max_attempts=3, backoff=2.0) decorator with exponential backoff. Build an async rate-limiter using asyncio.Semaphore that limits N concurrent calls.',
    dod:'✓ GIL implications explained for CPU-bound vs. I/O-bound\n✓ @retry decorator built and tested\n✓ Async rate-limiter verified with concurrent.futures test\n✓ Built a working async scraper using aiohttp + asyncio',
    prereqs:'P0N3,P1N1',
  },
  {
    id:'P2N2', phase:2, order:2, difficulty:'Hard', hours:30,
    title:'Django Architecture & Lifecycle',
    description:'Know Django so well you could debug any issue without documentation.\n\n• The complete request-response cycle (URLconf → Middleware → View → Response)\n• WSGI vs. ASGI: synchronous vs. asynchronous mode\n• Middleware stack: process_request, process_response, process_view, process_exception\n• Django settings: settings modules, django-environ, 12-factor app\n• Template engine, static files handling, management commands',
    hardcore:'Build a production-grade middleware suite: (1) Request Timing logging p95/p99 latencies, (2) Request-ID injection with UUID4, (3) IP Blacklist backed by database-driven blocklist with in-memory caching.',
    dod:'✓ Middleware suite fully implemented and unit-tested\n✓ Can draw the complete Django request-response cycle from memory\n✓ Understands WSGI vs ASGI with concrete use cases',
    prereqs:'P2N1',
  },
  {
    id:'P2N3', phase:2, order:3, difficulty:'Hard', hours:35,
    title:'Django ORM: The Battle of N+1',
    description:'DB query optimization separates mid from senior Django engineers.\n\n• Queryset evaluation mechanics: lazy loading, _result_cache\n• select_related vs prefetch_related (SQL JOINs vs separate queries)\n• Prefetch objects with custom querysets\n• annotate() vs aggregate(), F() and Q() expressions\n• select_for_update(): pessimistic locking\n• django-debug-toolbar: profiling in development',
    hardcore:'Take a Django view that fires 100+ queries. Profile with django-debug-toolbar. Reduce to < 5 queries using ORM optimization. Document every change with before/after SQL analysis.',
    dod:'✓ 100-query view reduced to < 5 queries\n✓ Can explain the exact SQL generated by any ORM call\n✓ django-debug-toolbar profiling documented\n✓ N+1 solved in 3 different scenarios',
    prereqs:'P2N2',
  },
  {
    id:'P2N4', phase:2, order:4, difficulty:'Hard', hours:30,
    title:'Domain-Driven Design in Django',
    description:'Architect Django apps that don\'t become unmaintainable at scale.\n\n• Service Layer pattern: pure Python functions encapsulating business logic\n• Selector pattern: DB query encapsulation separate from services\n• Repository pattern: abstracting data access\n• Django Signals: use cases and anti-patterns\n• Testing strategy: 100% coverage on service layer\n• Reference: HackSoftware\'s Django Styleguide',
    hardcore:'Take an existing fat-model Django app. Refactor it to Service + Selector architecture. Write tests for the service layer to achieve 100% coverage using pytest-django.',
    dod:'✓ App fully refactored to Service/Selector architecture\n✓ 100% test coverage on service layer verified with coverage.py\n✓ Can articulate trade-offs between DDD patterns and simpler approaches',
    prereqs:'P2N2',
  },
  {
    id:'P2N5', phase:2, order:5, difficulty:'Hard', hours:45,
    title:'Django REST Framework Power User',
    description:'DRF deep mastery — every Senior Django JD mentions this.\n\n• Serializer internals: validation flow, to_representation, to_internal_value\n• ViewSets & Routers: ModelViewSet, CustomActions (@action)\n• Custom Permissions & Authentication, JWT via SimpleJWT\n• Throttling: AnonRateThrottle, UserRateThrottle, ScopedRateThrottle\n• Pagination: PageNumberPagination, CursorPagination\n• API Versioning strategies, drf-spectacular (OpenAPI 3.0)',
    hardcore:'Build a paginated, versioned, JWT-authenticated REST API for a blog platform. Nested comments, like/unlike, user following, real-time validation. Document fully with drf-spectacular.',
    dod:'✓ Full blog API with all listed features\n✓ OpenAPI 3.0 docs generated and accurate\n✓ JWT + refresh token flow tested end-to-end\n✓ All throttling and pagination strategies implemented',
    prereqs:'P2N3,P2N4',
  },
  // ══════ PHASE 3 ══════════════════════════════════════════════════════════
  {
    id:'P3N1', phase:3, order:1, difficulty:'Extreme', hours:60,
    title:'Graph Theory Fundamentals (Gold)',
    description:'Graphs are everywhere — social networks, routing, state machines.\n\n• DFS/BFS (iterative + recursive), time/discovery stamps\n• Connected Components, Bipartite Check, Flood Fill\n• Topological Sort: Kahn\'s algorithm + DFS-based\n• Strongly Connected Components: Kosaraju\'s, Tarjan\'s algorithm\n• Cycle Detection in directed and undirected graphs\n• USACO Gold: solving 10 graph problems',
    hardcore:'Implement Tarjan\'s SCC algorithm from memory. Solve 10 USACO Gold graph problems: at least 3 TopSort, 3 BFS/DFS, 2 SCC, 2 Bipartite/Flood Fill.',
    dod:'✓ Tarjan\'s SCC implemented and tested\n✓ 10 USACO Gold graph problems solved\n✓ Can trace through Kosaraju\'s algorithm on paper',
    prereqs:'P1N4,P1N5',
  },
  {
    id:'P3N2', phase:3, order:2, difficulty:'Extreme', hours:50,
    title:'Shortest Paths & MST (Gold)',
    description:'Dijkstra, Bellman-Ford, and MST algorithms mastered to implementation level.\n\n• Dijkstra\'s: with min-heap O((V+E)logV), with matrix O(V²)\n• Bellman-Ford: negative edge detection, SPFA\n• Floyd-Warshall: all-pairs shortest path\n• Kruskal\'s MST: with DSU, Prim\'s MST with priority queue\n• Variants: shortest path with constraints, k-th shortest path',
    hardcore:'Implement Dijkstra\'s from scratch using a custom binary min-heap (NOT heapq). Solve 5 USACO Gold shortest path or MST problems.',
    dod:'✓ Dijkstra\'s implemented with custom min-heap\n✓ 5 USACO Gold shortest path problems solved\n✓ Correctly selected algorithm for 10 different problem scenarios',
    prereqs:'P3N1',
  },
  {
    id:'P3N3', phase:3, order:3, difficulty:'Extreme', hours:70,
    title:'Dynamic Programming (Gold)',
    description:'DP is the most asked topic in Elite+ technical interviews.\n\n• Memoization vs. Tabulation\n• Classic DPs: 0/1 Knapsack, Unbounded, Coin Change, LCS, LIS, Edit Distance\n• Interval DP: Matrix Chain Multiplication, Burst Balloons\n• Tree DP: Max independent set, tree diameter, rerooting\n• Digit DP, Bitmask DP, DP on DAGs\n• DP optimization: divide and conquer, convex hull trick (intro)',
    hardcore:'Solve the Travelling Salesman Problem with Bitmask DP. Solve 20 USACO Gold DP problems including 3 Bitmask DPs, 3 Tree DPs, 3 Interval DPs.',
    dod:'✓ TSP solved with Bitmask DP\n✓ 20 USACO Gold DP problems solved\n✓ Can derive DP recurrences for novel problems without hints',
    prereqs:'P3N1',
  },
  {
    id:'P3N4', phase:3, order:4, difficulty:'Extreme', hours:30,
    title:'Disjoint Set Union (Gold)',
    description:'Simple structure, profound applications.\n\n• Basic DSU: find() and union() from scratch\n• Path Compression: full, halving, splitting\n• Union by Rank and Union by Size\n• Amortized analysis: near-O(α(n)) per operation\n• Weighted DSU: tracking relative values\n• Rollback DSU: undo operations\n• Applications: Kruskal\'s MST, offline connectivity queries',
    hardcore:'Implement Weighted DSU for equivalence classes with weights. Solve 5 USACO Gold problems where DSU is the core data structure, including one offline problem.',
    dod:'✓ DSU with path compression + union by rank implemented\n✓ Weighted DSU implemented and tested\n✓ 5 USACO Gold DSU problems solved',
    prereqs:'P3N1',
  },
  {
    id:'P3N5', phase:3, order:5, difficulty:'Extreme', hours:60,
    title:'Advanced Data Structures (Gold)',
    description:'Segment Trees and Fenwick Trees — the Swiss Army knives of competitive programming.\n\n• Fenwick Tree / BIT: point update + prefix sum, range update + range query\n• 2D Fenwick Tree\n• Segment Tree: point update + range query (sum, min, max)\n• Segment Tree with Lazy Propagation: range update + range query\n• Sparse Table: static RMQ in O(1)\n• Square Root Decomposition',
    hardcore:'Implement a Segment Tree with Lazy Propagation from scratch (range add + range sum). Re-solve 3 problems using both Seg Tree and Fenwick Tree. Solve 5 USACO Gold problems using these structures.',
    dod:'✓ Segment Tree with Lazy Propagation fully implemented\n✓ 5 USACO Gold problems solved using Seg Tree / BIT\n✓ Sparse Table O(1) RMQ implemented',
    prereqs:'P3N2,P3N3,P3N4',
  },
  // ══════ PHASE 4 ══════════════════════════════════════════════════════════
  {
    id:'P4N1', phase:4, order:1, difficulty:'Hard', hours:50,
    title:'PostgreSQL Mastery',
    description:'Go far beyond basic SQL — this is what Staff engineers know.\n\n• Advanced Indexing: B-Tree, Hash, GIN (JSONB/arrays), GiST (geometric/range), BRIN\n• EXPLAIN ANALYZE: reading query plans, identifying seq scans\n• Transaction Isolation Levels: Read Uncommitted → Serializable\n• MVCC: how PostgreSQL implements isolation without read locks\n• Partitioning: Range, List, Hash — with Django migrations\n• Window Functions: ROW_NUMBER, RANK, LAG, LEAD, NTILE\n• CTEs and Recursive CTEs, Full-Text Search',
    hardcore:'Write a Django migration that introduces Range Partitioning to a 10M-row Orders table (partitioned by created_at month). Measure and document query speedup with EXPLAIN ANALYZE before/after.',
    dod:'✓ Partitioned 10M-row table, measured speedup documented\n✓ Can explain MVCC with concurrency anomaly examples\n✓ Written CTEs, Window Functions, and FTS queries in production code',
    prereqs:'P2N5',
  },
  {
    id:'P4N2', phase:4, order:2, difficulty:'Hard', hours:40,
    title:'Scalability Concepts',
    description:'The architectural vocabulary of Elite engineers.\n\n• Caching strategies: Cache-Aside, Write-through, Write-back, Write-around\n• Cache stampede prevention, Redis data structures (String, Hash, List, Set, Sorted Set, Stream)\n• Load Balancing: Round Robin, Least Connections, Consistent Hashing\n• Rate Limiting: Token Bucket, Leaky Bucket, Fixed/Sliding Window\n• Database Read Replicas: Django multi-database router\n• Connection Pooling: PgBouncer transaction mode',
    hardcore:'Implement Redis Cache-Aside in Django for a high-read endpoint. Implement a Token Bucket rate limiter using Redis + Lua scripts for atomicity. Measure cache hit ratio under load.',
    dod:'✓ Cache-Aside with 95%+ hit ratio implemented and tested\n✓ Token Bucket rate limiter with Lua scripts implemented\n✓ Can draw full load balancing and caching architecture diagram',
    prereqs:'P4N1',
  },
  {
    id:'P4N3', phase:4, order:3, difficulty:'Extreme', hours:35,
    title:'Distributed Systems Fundamentals',
    description:'Understanding why distributed systems are hard — and how to reason about them.\n\n• CAP Theorem: Consistency vs. Availability under Partition\n• PACELC Theorem, BASE properties, Eventual Consistency\n• Real-world examples: Cassandra (AP), HBase (CP), DynamoDB (configurable)\n• Idempotency: designing idempotent APIs with idempotency keys\n• SAGA Pattern: choreography vs. orchestration, compensating transactions\n• Raft conceptual understanding, Gossip Protocols, Consistent Hashing',
    hardcore:'Design and implement a SAGA orchestrator: Order → Payment → Inventory → Shipping. If any step fails, rollback via compensating transactions. Implement using Django + Celery.',
    dod:'✓ SAGA orchestrator with compensating transactions implemented\n✓ Can explain CAP theorem with real NoSQL database examples\n✓ Designed idempotent payment API with idempotency key + DB uniqueness constraint',
    prereqs:'P4N2',
  },
  {
    id:'P4N4', phase:4, order:4, difficulty:'Extreme', hours:55,
    title:'HLD System Case Studies',
    description:'Design canonical systems that appear in every Elite interview.\n\n• Payment Gateway (Razorpay-style): idempotency, double-charge prevention, reconciliation\n• Real-time Auction System: WebSocket scaling, bid locking, optimistic concurrency\n• Social Network Feed (Instagram-style): fan-out on write vs. read, celebrity problem\n• URL Shortener, Distributed Rate Limiter, Notification System\n• LLD warmup: Splitwise, Parking Lot, Tic-Tac-Toe, Chess',
    hardcore:'Complete the Splitwise Machine Coding challenge from scratch in Python in under 2 hours (full OOP, balance settlement, minimum transactions). Then present a full Razorpay-style payment gateway HLD.',
    dod:'✓ Splitwise completed in < 2 hours with minimum-transaction settlement\n✓ Full system designs prepared for all 6 canonical systems\n✓ Can identify bottlenecks and propose solutions in any of the above',
    prereqs:'P4N3,P3N5',
  },
  // ══════ PHASE 5 ══════════════════════════════════════════════════════════
  {
    id:'P5N1', phase:5, order:1, difficulty:'Hard', hours:40,
    title:'Low-Level Design (LLD) Mastery',
    description:'Design patterns and SOLID principles — foundation of senior engineering.\n\n• SOLID in Python: SRP, OCP, LSP, ISP, DIP (beyond basic definitions)\n• Creational: Factory Method, Abstract Factory, Builder, Singleton (thread-safe), Prototype\n• Structural: Adapter, Bridge, Composite, Decorator, Facade, Proxy, Flyweight\n• Behavioral: Observer, Strategy, Command, Template Method, State, Chain of Responsibility\n• Anti-patterns and when NOT to use patterns',
    hardcore:'Implement a Plugin Architecture for a task processing engine: Factory to register/create plugins dynamically, Strategy pattern for interchangeable algorithms, Observer for lifecycle hooks, support hot-reloading without engine restart.',
    dod:'✓ Plugin architecture with 3+ built-in plugins and hot-reload support\n✓ Can identify and justify the correct design pattern for any problem\n✓ 20 LLD problems solved/designed',
    prereqs:'P2N5,P4N3',
  },
  {
    id:'P5N2', phase:5, order:2, difficulty:'Medium', hours:25,
    title:'Containerization (Docker)',
    description:'Docker is table stakes for any senior backend role.\n\n• Docker internals: Linux namespaces, cgroups, union filesystems (OverlayFS)\n• Optimized Dockerfiles: multi-stage builds, layer caching, .dockerignore\n• Base image: python:3.12-slim vs alpine trade-offs, non-root user\n• Docker Compose: Django + Gunicorn + Nginx + PostgreSQL + Redis + Celery + Flower\n• Health checks, Docker networking, Volumes vs Bind Mounts',
    hardcore:'Write a production-grade docker-compose.yml with all 8 services. All must pass health checks. Django must serve through Nginx with gzip and static file caching. Multi-stage Dockerfile < 200MB.',
    dod:'✓ Full Compose stack running with all health checks passing\n✓ Django serving through Nginx with proper headers\n✓ Multi-stage Dockerfile < 200MB\n✓ Can explain namespace and cgroup isolation',
    prereqs:'P5N1',
  },
  {
    id:'P5N3', phase:5, order:3, difficulty:'Hard', hours:40,
    title:'Kubernetes Orchestration',
    description:'K8s is the operating system for the cloud. Know it deeply.\n\n• K8s Architecture: Control Plane (API Server, etcd, Scheduler), Node components (kubelet, kube-proxy)\n• Primitives: Pods, ReplicaSets, Deployments, StatefulSets, Jobs, CronJobs\n• Services: ClusterIP, NodePort, LoadBalancer, Ingress (Nginx, TLS)\n• ConfigMaps, Secrets, PersistentVolumes, HPA\n• Resource requests/limits, Rolling updates, Helm charts',
    hardcore:'Deploy full stack to Minikube/Kind. Configure HPA for Django pods (scale when CPU > 70%). Simulate load with k6 and verify auto-scaling. Implement a Helm chart for the entire application.',
    dod:'✓ Full stack deployed to local K8s\n✓ HPA configured and verified under load test\n✓ Helm chart created and working\n✓ Explains Deployment vs StatefulSet for PostgreSQL in production',
    prereqs:'P5N2',
  },
  {
    id:'P5N4', phase:5, order:4, difficulty:'Hard', hours:35,
    title:'Message Queues & Streaming (Kafka)',
    description:'Async communication is the heart of scalable microservices.\n\n• Messaging: Pub/Sub vs. Point-to-Point Queue\n• Kafka internals: Topics, Partitions, Offsets, Consumer Groups, Brokers\n• Delivery semantics: At-most-once, At-least-once, Exactly-once\n• Dead Letter Queues, RabbitMQ vs Kafka comparison\n• Celery: task queues, beat scheduler, result backends, chord/chain/group',
    hardcore:'Implement a notification service: Django publishes events to Kafka → Celery consumer routes to email/push/SMS based on user preferences → failed notifications go to DLQ with retry logic + Flower monitoring.',
    dod:'✓ Full Kafka → Celery notification pipeline implemented\n✓ DLQ with retry logic tested with fault injection\n✓ Can explain Kafka consumer group rebalancing from memory',
    prereqs:'P5N1',
  },
  {
    id:'P5N5', phase:5, order:5, difficulty:'Medium', hours:25,
    title:'CI/CD Pipelines',
    description:'Automate everything. Ship with confidence. Sleep at night.\n\n• GitHub Actions: workflow syntax, triggers, jobs, matrix builds\n• Django pipeline: lint (ruff) → type check (mypy) → tests (pytest) → coverage gate\n• Docker image build/push to GHCR, zero-downtime deployment strategies\n• Secrets management (GitHub Secrets), pre-commit hooks\n• GitLab CI/CD basics',
    hardcore:'Build a complete GitHub Actions pipeline: lint → test (coverage ≥ 80%) → Docker build → push to GHCR → deploy to staging on PR merge → production deploy on main with manual approval gate.',
    dod:'✓ Full pipeline runs on every PR\n✓ Coverage gate enforced at ≥ 80%\n✓ Docker image pushed to GHCR automatically\n✓ Staging auto-deploy on PR merge working',
    prereqs:'P5N2',
  },
  // ══════ PHASE 6 ══════════════════════════════════════════════════════════
  {
    id:'P6N1', phase:6, order:1, difficulty:'Hard', hours:30,
    title:'Observability & Monitoring',
    description:'You can\'t fix what you can\'t see. The three pillars of observability.\n\n• Metrics: Prometheus data model, PromQL, django-prometheus\n• Grafana: dashboards, variables, alerting rules\n• The Four Golden Signals: Latency, Traffic, Errors, Saturation\n• Logs: structured logging (structlog), ELK Stack, or Loki + Promtail\n• Traces: OpenTelemetry, Jaeger/Tempo (distributed tracing)\n• SLO/SLI/SLA: error budgets, burn rate alerts',
    hardcore:'Deploy complete observability stack via docker-compose. Create Grafana dashboards: request rate, error rate, p50/p95/p99 latency, DB query time, cache hit ratio. Configure alert: error rate > 1% for > 5 minutes.',
    dod:'✓ Prometheus + Grafana stack deployed\n✓ Four Golden Signals visible in Grafana\n✓ Alert for error rate > 1% configured and tested\n✓ Structured logging sending to ELK/Loki',
    prereqs:'P5N3,P5N4,P5N5',
  },
  {
    id:'P6N2', phase:6, order:2, difficulty:'Hard', hours:25,
    title:'Security Hardening',
    description:'Security is non-negotiable at Elite companies. Know OWASP Top 10 cold.\n\n• Injection: SQL, NoSQL, command — Django-specific mitigations\n• Broken Authentication: session management, JWT security (alg:none attack)\n• XSS: reflected, stored, DOM-based — Django auto-escaping, CSP headers\n• CSRF: Django CSRF middleware internals, SameSite cookies\n• IDOR, Security Misconfiguration, SSRF, OAuth2 security (state, PKCE)',
    hardcore:'Audit your Django project with Bandit (static analysis) + Safety (dependency vulns). Fix ALL high/medium findings. Implement strict Content Security Policy via middleware. Demonstrate JWT alg:none attack defense.',
    dod:'✓ Zero high/medium Bandit findings\n✓ Zero known vulnerable dependencies\n✓ CSP middleware implemented and verified\n✓ Can describe 8+ OWASP Top 10 vulnerabilities with Django-specific examples',
    prereqs:'P5N1',
  },
  {
    id:'P6N3', phase:6, order:3, difficulty:'Extreme', hours:120,
    title:'The Capstone: Final Assault on Elite',
    description:'Build, deploy, and optimize a production-grade distributed application.\n\n• Domain: Real-time Crypto Analytics Engine\n• Stack: Django ASGI + WebSockets (Channels), Kafka for transaction streaming, PostgreSQL with range partitioning, Redis for channel layers + caching, Celery for aggregation jobs, Kubernetes on AWS EKS, Nginx Ingress, Full observability, CI/CD pipeline\n• Features: Live price dashboard (WebSocket), Historical analytics API, Alert system via Kafka + Celery, Portfolio tracking per user, Admin panel with metrics\n• Architecture diagram with full data flow annotations',
    hardcore:'Deploy to AWS EKS. Load test with Locust/k6: handle 10,000 requests per second. Profile and fix every bottleneck. Write a detailed technical blog post about architecture decisions, challenges, and measured results.',
    dod:'✓ Application deployed to AWS EKS\n✓ Handles 10,000 RPS under sustained load test\n✓ P99 latency < 200ms at peak load\n✓ Full observability with dashboards\n✓ CI/CD pipeline deploying on every merge\n✓ Architecture blog post published',
    prereqs:'P6N1,P6N2',
  },
  {
    id:'P6N4', phase:6, order:4, difficulty:'Medium', hours:15,
    title:'Resume & Brand Building (Elite Specific)',
    description:'The technical work means nothing if you can\'t sell it.\n\n• Quantify every impact: "Reduced API latency from 800ms to 90ms by Redis caching + DB optimization"\n• Narrative: architecture decisions, scale solved, complexities overcome\n• ATS optimization: keyword targeting for Senior/Staff Django roles\n• LinkedIn: featured projects, skills (PostgreSQL, Django, Kubernetes, Kafka), recommendations\n• GitHub profile: pinned repos, comprehensive READMEs, architecture diagrams\n• Target: Razorpay, BrowserStack, Groww, Meesho, Rippling, Postman, Chargebee',
    hardcore:'Write 3 technical blog posts (min 1500 words each) on your capstone, Kafka pipeline, or K8s deployment. Target 1,000 views on at least one post within 30 days using dev.to + LinkedIn.',
    dod:'✓ Resume quantified, reviewed by at least 1 senior engineer\n✓ LinkedIn profile with 500+ connections and 3 featured projects\n✓ 3 blog posts published\n✓ Applied to 20 target companies with personalized applications',
    prereqs:'P6N3',
  },
  {
    id:'P6N5', phase:6, order:5, difficulty:'Hard', hours:40,
    title:'Mock Interviews & Negotiation Mastery',
    description:'The interview is a skill. Train like an athlete.\n\n• System Design (HLD) mocks: Twitter, Uber, WhatsApp, Netflix (10 full sessions)\n• LLD mocks: Parking Lot, Chess, Library Management, Snake & Ladder (10 sessions)\n• DSA mock contests: 2-hour timed sessions, real interview pressure\n• Behavioral: STAR format, leadership stories, conflict resolution\n• Negotiation: base + ESOP + variable, competing offer strategy\n• ESOP valuation: vesting schedules, cliff, strike price\n• Notice period leveraging, understanding market rates at target companies',
    hardcore:'Complete 10 mock HLD + 10 mock LLD sessions. Achieve average ≥ 8/10. Role-play: negotiate a mock offer from 30LPA to 42LPA using a competing offer.',
    dod:'✓ Average ≥ 8/10 across 20 mock sessions (logged in this app)\n✓ Negotiation script prepared and rehearsed\n✓ Can present any of 4 canonical HLD systems in 45 minutes with trade-off analysis',
    prereqs:'P6N4',
  },
];

// ─── Database Class (JSON file store) ─────────────────────────────────────
class Database {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.store = {
      nodes:         [],
      progressLog:   [],
      interviews:    [],
      usacoProblems: [],
      cfRatings:     [],
    };
    this._nextIds = { progressLog:1, interviews:1, usacoProblems:1, cfRatings:1 };
  }

  init() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this._load();
    if (this.store.nodes.length === 0) {
      this._seedNodes();
    }
    // Recompute next IDs from loaded data
    for (const key of ['progressLog','interviews','usacoProblems','cfRatings']) {
      const items = this.store[key];
      if (items.length > 0) {
        this._nextIds[key] = Math.max(...items.map(i => i.id)) + 1;
      }
    }
  }

  _load() {
    for (const key of Object.keys(this.store)) {
      const file = path.join(this.dataDir, `${key}.json`);
      if (fs.existsSync(file)) {
        try { this.store[key] = JSON.parse(fs.readFileSync(file, 'utf-8')); }
        catch(e) { console.error(`JSON parse error in ${key}.json:`, e.message); }
      }
    }
  }

  _save(key) {
    const file = path.join(this.dataDir, `${key}.json`);
    fs.writeFileSync(file, JSON.stringify(this.store[key], null, 2), 'utf-8');
  }

  _seedNodes() {
    this.store.nodes = SEED_NODES.map(n => ({
      id: n.id, phase_number: n.phase, node_order: n.order,
      title: n.title, description: n.description,
      hardcore_element: n.hardcore, definition_of_done: n.dod,
      prerequisites: n.prereqs, estimated_hours: n.hours,
      difficulty: n.difficulty, notes: '',
      is_completed: 0, completion_timestamp: null,
    }));
    this._save('nodes');
  }

  _nextId(key) { return this._nextIds[key]++; }

  // ── Node CRUD ──────────────────────────────────────────────────────────────
  getAllNodes() {
    return [...this.store.nodes].sort((a,b) =>
      a.phase_number !== b.phase_number
        ? a.phase_number - b.phase_number
        : a.node_order - b.node_order
    );
  }
  getNode(id) { return this.store.nodes.find(n => n.id === id) || null; }
  completeNode(id, completed) {
    const n = this.store.nodes.find(n => n.id === id);
    if (n) {
      n.is_completed = completed ? 1 : 0;
      n.completion_timestamp = completed ? new Date().toISOString() : null;
      this._save('nodes');
    }
    return { success: true };
  }
  updateNotes(id, notes) {
    const n = this.store.nodes.find(n => n.id === id);
    if (n) { n.notes = notes; this._save('nodes'); }
    return { success: true };
  }

  // ── Progress Log ───────────────────────────────────────────────────────────
  logProgress({ nodeId, hours, logType, description }) {
    this.store.progressLog.push({
      id: this._nextId('progressLog'),
      node_id: nodeId, timestamp: new Date().toISOString(),
      hours_logged: hours, log_type: logType,
      log_description: description || '',
    });
    this._save('progressLog');
    return { success: true };
  }
  getProgress(nodeId) {
    const items = nodeId
      ? this.store.progressLog.filter(l => l.node_id === nodeId)
      : this.store.progressLog.slice(-50);
    return [...items].sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  getStats() {
    const nodes = this.store.nodes;
    const logs  = this.store.progressLog;
    const totalNodes     = nodes.length;
    const completedNodes = nodes.filter(n => n.is_completed).length;
    const totalHours     = logs.reduce((s,l) => s + l.hours_logged, 0);
    const totalEstimated = nodes.reduce((s,n) => s + n.estimated_hours, 0);
    const weekAgo        = new Date(Date.now() - 7*24*60*60*1000).toISOString();
    const weekHours      = logs.filter(l => l.timestamp >= weekAgo).reduce((s,l) => s + l.hours_logged, 0);
    const twoWeeksAgo    = new Date(Date.now() - 14*24*60*60*1000).toISOString();

    // Daily hours (last 14 days)
    const dayMap = {};
    logs.filter(l => l.timestamp >= twoWeeksAgo).forEach(l => {
      const day = l.timestamp.split('T')[0];
      dayMap[day] = (dayMap[day] || 0) + l.hours_logged;
    });
    const dailyHours = Object.entries(dayMap)
      .map(([date,hours]) => ({date,hours}))
      .sort((a,b) => a.date.localeCompare(b.date));

    // Log type breakdown
    const typeMap = {};
    logs.forEach(l => { typeMap[l.log_type] = (typeMap[l.log_type]||0) + l.hours_logged; });
    const logTypeBreakdown = Object.entries(typeMap).map(([log_type,hours]) => ({log_type,hours}));

    // Phase progress
    const phaseMap = {};
    nodes.forEach(n => {
      if (!phaseMap[n.phase_number]) phaseMap[n.phase_number] = {phase_number:n.phase_number,total:0,completed:0,est_hours:0};
      phaseMap[n.phase_number].total++;
      phaseMap[n.phase_number].est_hours += n.estimated_hours;
      if (n.is_completed) phaseMap[n.phase_number].completed++;
    });
    const phaseProgress = Object.values(phaseMap).sort((a,b) => a.phase_number - b.phase_number);

    // Recent activity
    const recentActivity = [...logs]
      .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0,10)
      .map(l => ({ ...l, node_title: (nodes.find(n => n.id === l.node_id)||{title:'Unknown'}).title }));

    // Current phase
    const incomplete = nodes.filter(n => !n.is_completed).sort((a,b) => a.phase_number-b.phase_number || a.node_order-b.node_order)[0];
    const currentPhase = incomplete ? incomplete.phase_number : 6;

    return {
      totalNodes, completedNodes, totalHours, totalEstimated,
      weekHours, dailyHours, logTypeBreakdown, phaseProgress,
      recentActivity, currentPhase,
      overallPercent: totalNodes > 0 ? Math.round((completedNodes/totalNodes)*100) : 0,
    };
  }

  // ── Mock Interviews ────────────────────────────────────────────────────────
  addInterview({ type, interviewerType, score, feedback }) {
    this.store.interviews.push({
      id: this._nextId('interviews'), interview_type: type,
      date: new Date().toISOString(), interviewer_type: interviewerType,
      score: score, feedback: feedback || '',
    });
    this._save('interviews');
    return { success: true };
  }
  getInterviews() {
    return [...this.store.interviews].sort((a,b) => new Date(b.date) - new Date(a.date));
  }

  // ── USACO Problems ─────────────────────────────────────────────────────────
  getUSACOProblems() { return [...this.store.usacoProblems]; }
  addUSACOProblem({ name, url, level, category, difficulty, nodeId, notes }) {
    this.store.usacoProblems.push({
      id: this._nextId('usacoProblems'), problem_name: name,
      problem_url: url||'', level, category: category||'General',
      status: 'Unsolved', difficulty: difficulty||3,
      node_id: nodeId||'', notes: notes||'',
      solved_date: null, time_taken: 0,
    });
    this._save('usacoProblems');
    return { success: true };
  }
  updateUSACOProblem({ id, status, notes, timeTaken }) {
    const p = this.store.usacoProblems.find(p => p.id === id);
    if (p) {
      p.status = status; p.notes = notes||''; p.time_taken = timeTaken||0;
      p.solved_date = status === 'Solved' ? new Date().toISOString() : null;
      this._save('usacoProblems');
    }
    return { success: true };
  }

  // ── Codeforces Rating ──────────────────────────────────────────────────────
  getCFRatings() {
    return [...this.store.cfRatings].sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  addCFRating({ rating, contestName }) {
    this.store.cfRatings.push({
      id: this._nextId('cfRatings'), timestamp: new Date().toISOString(),
      rating, contest_name: contestName||'',
    });
    this._save('cfRatings');
    return { success: true };
  }

  // ── Dangerous Operations ───────────────────────────────────────────────────
  factoryReset() {
    this.store.usacoProblems = [];
    this.store.interviews = [];
    this.store.cfRatings = [];
    this.store.progressLogs = [];
    this._seedNodes(); // this overwrites nodes and saves it
    this._save('usacoProblems');
    this._save('interviews');
    this._save('cfRatings');
    this._save('progressLogs');
    return { success: true };
  }
}

module.exports = Database;
