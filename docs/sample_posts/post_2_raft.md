# 在 Rust 中实现 Raft 分布式一致性算法：Leader Election 详解

Raft 是一种为了管理复制日志的一致性算法。它的设计目标是易于理解，相比 Paxos，Raft 将一致性问题分解为几个相对独立的子问题：

1.  **Leader Election** (领导者选举)
2.  **Log Replication** (日志复制)
3.  **Safety** (安全性)

## Leader Election 状态机

在 Raft 中，一个节点（Server）在任意时刻处于以下三种状态之一：

-   `Follower`: 被动响应请求。
-   `Candidate`: 竞选 Leader。
-   `Leader`: 处理所有客户端请求。

状态转换逻辑如下：

> Follower -> (超时) -> Candidate -> (获得多数票) -> Leader

## Rust 实现核心逻辑

我们定义一个 `RaftNode` 结构体来保存状态，并实现 `RequestVote` RPC 的处理逻辑。

```rust
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

#[derive(Debug, PartialEq)]
enum State {
    Follower,
    Candidate,
    Leader,
}

pub struct RaftNode {
    id: u64,
    current_term: u64,
    voted_for: Option<u64>,
    log: Vec<LogEntry>,
    state: State,
    election_timer: Instant,
}

impl RaftNode {
    /// 处理来自其他 Candidate 的投票请求
    pub fn handle_request_vote(
        &mut self, 
        candidate_term: u64, 
        candidate_id: u64
    ) -> (u64, bool) {
        
        // 1. 如果请求的任期小于当前任期，拒绝投票
        if candidate_term < self.current_term {
            return (self.current_term, false);
        }

        // 2. 如果任期更新，转为 Follower 并重置投票
        if candidate_term > self.current_term {
            self.current_term = candidate_term;
            self.voted_for = None;
            self.state = State::Follower;
        }

        // 3. 检查是否已经投过票（或者投给了该 Candidate）
        if self.voted_for.is_none() || self.voted_for == Some(candidate_id) {
            self.voted_for = Some(candidate_id);
            self.reset_election_timer();
            println!("Node {} voted for Node {} in term {}", self.id, candidate_id, self.current_term);
            return (self.current_term, true);
        }

        (self.current_term, false)
    }

    fn reset_election_timer(&mut self) {
        self.election_timer = Instant::now();
    }
}
```

## 关键挑战：Split Vote

当多个 Follower 同时成为 Candidate 时，可能会出现**瓜分选票 (Split Vote)** 的情况。Raft 通过**随机化选举超时时间 (Randomized Election Timeout)** 来优雅地解决这个问题（通常在 150ms - 300ms 之间）。

这大大降低了多个节点同时发起选举的概率，保证了系统的可用性。
