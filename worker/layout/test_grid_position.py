import unittest

from worker.layout.grid_position import estimate_grid_position


class GridPositionTests(unittest.TestCase):
    def test_estimates_main_grid_row_and_column_from_normalized_label_position(self) -> None:
        position = estimate_grid_position(
            bounding_box={"x": 255, "y": 420, "width": 90, "height": 28},
            frame_width=720,
            frame_height=1280,
        )

        self.assertEqual(
            position,
            {
                "area": "mainGrid",
                "row": 2,
                "column": 2,
            },
        )

    def test_classifies_low_labels_as_dock(self) -> None:
        position = estimate_grid_position(
            bounding_box={"x": 560, "y": 1145, "width": 80, "height": 24},
            frame_width=720,
            frame_height=1280,
        )

        self.assertEqual(position, {"area": "dock", "column": 4})

    def test_classifies_large_upper_labels_as_widget_area(self) -> None:
        position = estimate_grid_position(
            bounding_box={"x": 80, "y": 250, "width": 360, "height": 42},
            frame_width=720,
            frame_height=1280,
        )

        self.assertEqual(position, {"area": "widgetArea"})


if __name__ == "__main__":
    unittest.main()
