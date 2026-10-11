"""
SymPy hesaplamalarını ayrı süreçlerde, zaman aşımıyla çalıştırır.

Bazı ifadeler (ör. çok büyük kuvvetlerin integrali) SymPy'yi dakikalarca meşgul edebilir.
Thread'ler öldürülemediği için hesaplama bir süreç havuzunda yapılır; süre aşılırsa
havuzdaki süreçler sonlandırılır ve havuz yeniden kurulur.
"""

from __future__ import annotations

import multiprocessing
import threading
from collections.abc import Callable
from concurrent.futures import ProcessPoolExecutor
from concurrent.futures import TimeoutError as FutureTimeout
from concurrent.futures.process import BrokenProcessPool
from typing import Any


class ComputationTimeout(RuntimeError):
    pass


class Sandbox:
    def __init__(self, workers: int = 2, timeout: float = 6.0) -> None:
        self.workers = workers
        self.timeout = timeout
        self._executor: ProcessPoolExecutor | None = None
        self._lock = threading.Lock()

    def _pool(self) -> ProcessPoolExecutor:
        with self._lock:
            if self._executor is None:
                self._executor = ProcessPoolExecutor(max_workers=self.workers, mp_context=multiprocessing.get_context("spawn"))
            return self._executor

    def _kill(self) -> None:
        with self._lock:
            executor, self._executor = self._executor, None
        if executor is None:
            return
        for proc in list(getattr(executor, "_processes", {}).values()):
            proc.terminate()
        executor.shutdown(wait=False, cancel_futures=True)

    def run(self, fn: Callable[..., Any], *args: Any, timeout: float | None = None) -> Any:
        future = self._pool().submit(fn, *args)
        try:
            return future.result(timeout=timeout or self.timeout)
        except FutureTimeout as exc:
            self._kill()
            raise ComputationTimeout("Hesaplama çok uzun sürdü.") from exc
        except BrokenProcessPool:
            self._kill()
            raise

    def shutdown(self) -> None:
        self._kill()


_sandbox: Sandbox | None = None


def get_sandbox() -> Sandbox:
    global _sandbox
    if _sandbox is None:
        from app.core.config import get_settings

        s = get_settings()
        _sandbox = Sandbox(workers=s.sympy_workers, timeout=s.sympy_timeout)
    return _sandbox
