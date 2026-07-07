"""
The analytics app is intentionally model-less: it composes read-only
aggregations over data owned by `interviews`, `analysis`, and
`scoring`, avoiding duplicated/denormalized state that could drift out
of sync with the source of truth.
"""
