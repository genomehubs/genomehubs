"""Landing page tests."""


import contextlib
import pytest
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:8880"


@pytest.mark.usefixtures("setup")
class TestLandingPage:
    """Landing page tests."""

    def test_title(self):
        """Check page title is set."""
        self.driver.get(BASE_URL)
        time.sleep(2)
        assert self.driver.title == "test_instance"

    def test_histogram(self):
        """Check histogram loads."""
        self.driver.get(
            f"{BASE_URL}/report?report=histogram&x=assembly_date&rank=species&cat=assembly_level&stacked=true&includeEstimates=true&excludeAncestral%5B0%5D=assembly_span&excludeMissing%5B0%5D=assembly_span&caption=Progress%20of%20genome%20assemblies%20published%20on%20INSDC%20over%20time%2C%20by%20assembly%20level&taxonomy=ncbi&result=taxon"
        )
        time.sleep(2)
        histogram = None
        with contextlib.suppress(Exception):
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "theme-base"))
            )
            WebDriverWait(self.driver, 10).until(
                EC.visibility_of_element_located((By.ID, "histogram"))
            )
            time.sleep(3)
        histogram = self.driver.find_element(By.ID, "histogram")
        assert histogram is not None
        svg = None
        with contextlib.suppress(Exception):
            time.sleep(3)
            svg = histogram.find_element(By.TAG_NAME, "svg")
        assert svg is not None
        bars = None
        with contextlib.suppress(Exception):
            bars = svg.find_elements(By.CLASS_NAME, "recharts-bar")
        assert bars is not None
        assert len(bars) == 6
