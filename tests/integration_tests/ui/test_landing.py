import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

BASE_URL = "http://localhost:8880"


@pytest.mark.usefixtures("setup")
class TestLandingPage:
    def test_title(self):
        self.driver.get(BASE_URL)
        assert self.driver.title == "GoaT"

    def test_histogram(self):
        self.driver.get(f"{BASE_URL}/report?report=histogram&x=assembly_date&rank=species&cat=assembly_level&stacked=true&includeEstimates=true&excludeAncestral%5B0%5D=assembly_span&excludeMissing%5B0%5D=assembly_span&caption=Progress%20of%20genome%20assemblies%20published%20on%20INSDC%20over%20time%2C%20by%20assembly%20level&taxonomy=ncbi&result=taxon")
        histogram = None
        try:
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, "histogram"))
            )
            histogram = self.driver.find_element(By.ID, "histogram")
        except Exception:
            pass
        assert histogram is not None
        svg = None
        try:
            svg = histogram.find_element(By.TAG_NAME, "svg")
        except Exception:
            pass
        assert svg is not None
        bars = None
        try:
            bars = svg.find_elements(By.CLASS_NAME, "recharts-bar")
        except Exception:
            pass
        assert bars is not None
        assert len(bars) == 6
        
    # def test_title_blog(self):
    #     self.driver.get('https://www.delrayo.tech/blog')
    #     print(self.driver.title)