"""
Typed wrappers around `django-environ`.

`django-environ` ships its own inline types where `Env.__call__` (and
`.bool`/`.int`/`.list`/`.db`, etc.) type the `default` parameter against
its internal `NoValue` sentinel rather than the actual return type. That
makes pyright reject perfectly valid calls like
`env("DJANGO_SECRET_KEY", default="insecure-dev-key-change-me")` with
"Literal[...] cannot be assigned to NoValue".

These helpers wrap each accessor and `cast()` the result to the type we
actually expect back, so `config/settings/*.py` can call them without
suppressing warnings line-by-line.

The `env` parameter itself is cast to `Any` before each call: pyright
resolves overloads (and their `NoValue`-typed `default` parameter)
against the *static* type of the receiver, so passing a concrete
default always fails overload matching even from inside this module
unless the receiver's type is erased first.
"""
from typing import Any, cast

import environ  # type: ignore[import-untyped]


def env_str(env: "environ.Env", key: str, default: str = "") -> str:
    return cast(str, cast(Any, env)(key, default=default))


def env_bool(env: "environ.Env", key: str, default: bool = False) -> bool:
    return cast(bool, cast(Any, env).bool(key, default=default))


def env_int(env: "environ.Env", key: str, default: int = 0) -> int:
    return cast(int, cast(Any, env).int(key, default=default))


def env_list(env: "environ.Env", key: str, default: list[str] | None = None) -> list[str]:
    return cast(list, cast(Any, env).list(key, default=default if default is not None else []))


def env_db_url(env: "environ.Env", key: str, default: str) -> dict:
    return cast(dict, cast(Any, env).db(key, default=default))
