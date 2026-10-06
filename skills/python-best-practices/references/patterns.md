# Python patterns

## Sum types

```python
from dataclasses import dataclass
from typing import assert_never

@dataclass(frozen=True, slots=True)
class Loading: ...

@dataclass(frozen=True, slots=True)
class Ready:
    diff: "GitDiff"

@dataclass(frozen=True, slots=True)
class Failed:
    error: str

DiffState = Loading | Ready | Failed   # no optional-field bag

def render(state: DiffState) -> str:
    match state:
        case Loading():
            return "loading"
        case Ready(diff=d):
            return d.summary()
        case Failed(error=e):
            return f"error: {e}"
        case _:
            assert_never(state)   # a new variant fails the type check
```

## Branded primitives

```python
from typing import NewType
import uuid

AgentId = NewType("AgentId", str)

def parse_agent_id(raw: str) -> AgentId:
    uuid.UUID(raw)                 # raises ValueError on bad input
    return AgentId(raw)

def focus(agent: AgentId) -> None: ...   # input is trusted
```

## Parse at the boundary

```python
from pydantic import BaseModel, ConfigDict

class CreateTask(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")
    title: str
    priority: int = 0

def handle(raw: object) -> Task:
    cmd = CreateTask.model_validate(raw)   # raw is untyped until here
    return service.create(cmd)             # inside: typed, no re-validation
```

## Non-empty by construction

```python
def pick_winner(first: str, *rest: str) -> str:
    entries = (first, *rest)
    return entries[random.randrange(len(entries))]
```

## Protocol at a seam

```python
from typing import Protocol

class PaymentGateway(Protocol):
    def charge(self, cents: int) -> str: ...

def checkout(cart: Cart, gateway: PaymentGateway) -> Receipt:   # injected, easy to fake
    return Receipt(gateway.charge(cart.total_cents))
```

## Narrowing without `cast`

```python
def is_str_list(value: object) -> TypeGuard[list[str]]:
    return isinstance(value, list) and all(isinstance(v, str) for v in value)   # the guard really checks
```

## Errors

```python
class TaskError(Exception): ...
class TaskNotFound(TaskError): ...

def load(task_id: TaskId) -> Task:
    row = db.fetch(task_id)
    if row is None:
        raise TaskNotFound(task_id)
    return Task.from_row(row)
```
