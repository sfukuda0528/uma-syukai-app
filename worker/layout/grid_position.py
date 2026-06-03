from typing import Literal, TypedDict


HomeArea = Literal["mainGrid", "dock", "widgetArea", "unknown"]


class GridPosition(TypedDict, total=False):
    area: HomeArea
    row: int
    column: int


def estimate_grid_position(
    *,
    bounding_box: dict[str, int] | None,
    frame_width: int | None,
    frame_height: int | None,
) -> GridPosition | None:
    if not bounding_box or not frame_width or not frame_height or frame_width <= 0 or frame_height <= 0:
        return None

    x = bounding_box["x"] + bounding_box["width"] / 2
    y = bounding_box["y"] + bounding_box["height"] / 2
    normalized_x = x / frame_width
    normalized_y = y / frame_height
    normalized_width = bounding_box["width"] / frame_width

    if normalized_y >= 0.84:
        return {"area": "dock", "column": _bucket(normalized_x, 4)}

    if normalized_width >= 0.35 and normalized_y < 0.38:
        return {"area": "widgetArea"}

    if 0.16 <= normalized_y < 0.84:
        return {
            "area": "mainGrid",
            "row": _bucket((normalized_y - 0.16) / 0.68, 6),
            "column": _bucket(normalized_x, 4),
        }

    return {"area": "unknown"}


def _bucket(value: float, count: int) -> int:
    bounded = max(0.0, min(0.999, value))
    return int(bounded * count) + 1
