"""
Backend API Tests for Daily Progress Tracker
Tests: logs, custom activities, history, stats, library, reviews
"""
import pytest
import requests
import os
from datetime import datetime
from pathlib import Path

# Read BASE_URL from frontend .env
env_path = Path(__file__).parent.parent.parent / 'frontend' / '.env'
BASE_URL = None
if env_path.exists():
    with open(env_path) as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                BASE_URL = line.split('=', 1)[1].strip()
                break

if not BASE_URL:
    raise ValueError("EXPO_PUBLIC_BACKEND_URL not found in frontend/.env")

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture
def test_date():
    """Test date for logs"""
    return "2026-01-15"

@pytest.fixture
def cleanup_test_data(api_client, test_date):
    """Cleanup test data after tests"""
    yield
    # Cleanup is handled by MongoDB TTL or manual cleanup if needed

class TestHealthCheck:
    """Health check endpoint"""
    
    def test_api_root(self, api_client):
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data

class TestLogs:
    """Daily logs CRUD tests"""
    
    def test_get_log_empty(self, api_client, test_date):
        """GET log for date with no data"""
        response = api_client.get(f"{BASE_URL}/api/logs/{test_date}")
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == test_date
        assert data["mood"] is None or isinstance(data["mood"], str)
        assert isinstance(data["entries"], dict)
    
    def test_save_log_and_verify(self, api_client, test_date):
        """POST log and verify persistence with GET"""
        log_payload = {
            "date": test_date,
            "mood": "productive",
            "entries": {
                "work": {
                    "startTime": "08:00",
                    "endTime": "17:00",
                    "quality": 4,
                    "notes": "TEST_Completed project tasks",
                    "learned": "TEST_New framework features",
                    "sources": "TEST_Documentation"
                },
                "gym": {
                    "startTime": "18:00",
                    "endTime": "19:00",
                    "quality": 5,
                    "notes": "TEST_Strength training"
                }
            }
        }
        
        # Save log
        save_response = api_client.post(f"{BASE_URL}/api/logs", json=log_payload)
        assert save_response.status_code == 200
        save_data = save_response.json()
        assert save_data["status"] == "saved"
        assert save_data["date"] == test_date
        
        # Verify persistence with GET
        get_response = api_client.get(f"{BASE_URL}/api/logs/{test_date}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["date"] == test_date
        assert get_data["mood"] == "productive"
        assert "work" in get_data["entries"]
        assert get_data["entries"]["work"]["quality"] == 4
        assert "TEST_Completed project tasks" in get_data["entries"]["work"]["notes"]
    
    def test_update_existing_log(self, api_client, test_date):
        """Update existing log and verify changes"""
        # First save
        initial_payload = {
            "date": test_date,
            "mood": "happy",
            "entries": {"reading": {"quality": 3}}
        }
        api_client.post(f"{BASE_URL}/api/logs", json=initial_payload)
        
        # Update
        updated_payload = {
            "date": test_date,
            "mood": "focused",
            "entries": {"reading": {"quality": 5, "notes": "TEST_Updated notes"}}
        }
        update_response = api_client.post(f"{BASE_URL}/api/logs", json=updated_payload)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = api_client.get(f"{BASE_URL}/api/logs/{test_date}")
        get_data = get_response.json()
        assert get_data["mood"] == "focused"
        assert get_data["entries"]["reading"]["quality"] == 5

class TestCustomActivities:
    """Custom activities CRUD tests"""
    
    def test_get_custom_activities(self, api_client):
        """GET custom activities list"""
        response = api_client.get(f"{BASE_URL}/api/custom-activities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_create_custom_activity_and_verify(self, api_client):
        """POST custom activity and verify with GET"""
        activity_payload = {
            "name": "TEST_Meditation",
            "icon": "leaf-outline",
            "color": "#88AA88"
        }
        
        # Create activity
        create_response = api_client.post(f"{BASE_URL}/api/custom-activities", json=activity_payload)
        assert create_response.status_code == 200
        created = create_response.json()
        assert "id" in created
        assert created["name"] == "TEST_Meditation"
        assert created["icon"] == "leaf-outline"
        assert created["color"] == "#88AA88"
        assert created["isCustom"] is True
        
        activity_id = created["id"]
        
        # Verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/custom-activities")
        assert get_response.status_code == 200
        activities = get_response.json()
        found = any(a["id"] == activity_id and a["name"] == "TEST_Meditation" for a in activities)
        assert found, "Created activity not found in list"
        
        # Cleanup
        delete_response = api_client.delete(f"{BASE_URL}/api/custom-activities/{activity_id}")
        assert delete_response.status_code == 200
    
    def test_delete_custom_activity(self, api_client):
        """DELETE custom activity and verify removal"""
        # Create activity
        activity_payload = {"name": "TEST_ToDelete", "icon": "star-outline", "color": "#FF0000"}
        create_response = api_client.post(f"{BASE_URL}/api/custom-activities", json=activity_payload)
        activity_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/custom-activities/{activity_id}")
        assert delete_response.status_code == 200
        
        # Verify deletion
        get_response = api_client.get(f"{BASE_URL}/api/custom-activities")
        activities = get_response.json()
        found = any(a["id"] == activity_id for a in activities)
        assert not found, "Deleted activity still exists"
    
    def test_delete_nonexistent_activity(self, api_client):
        """DELETE non-existent activity returns 404"""
        response = api_client.delete(f"{BASE_URL}/api/custom-activities/nonexistent_id")
        assert response.status_code == 404

class TestHistory:
    """History endpoint tests"""
    
    def test_get_history(self, api_client):
        """GET history returns list of logs"""
        response = api_client.get(f"{BASE_URL}/api/history")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if len(data) > 0:
            item = data[0]
            assert "date" in item
            assert "activity_count" in item
            assert "activities" in item
            assert isinstance(item["activities"], list)
    
    def test_get_history_detail(self, api_client, test_date):
        """GET history detail for specific date"""
        response = api_client.get(f"{BASE_URL}/api/history/{test_date}")
        assert response.status_code == 200
        data = response.json()
        assert "log" in data
        assert "review" in data
        assert data["log"]["date"] == test_date

class TestStats:
    """Weekly stats endpoint tests"""
    
    def test_get_weekly_stats_default(self, api_client):
        """GET weekly stats without date parameter"""
        response = api_client.get(f"{BASE_URL}/api/stats/weekly")
        assert response.status_code == 200
        data = response.json()
        assert "week_dates" in data
        assert "total_activities_logged" in data
        assert "average_quality" in data
        assert "days_with_logs" in data
        assert "daily_summary" in data
        assert "activity_breakdown" in data
        assert len(data["week_dates"]) == 7
        assert isinstance(data["daily_summary"], list)
        assert isinstance(data["activity_breakdown"], list)
    
    def test_get_weekly_stats_with_date(self, api_client, test_date):
        """GET weekly stats for specific date"""
        response = api_client.get(f"{BASE_URL}/api/stats/weekly?date={test_date}")
        assert response.status_code == 200
        data = response.json()
        assert len(data["week_dates"]) == 7
        assert test_date in data["week_dates"]

class TestLibrary:
    """Library endpoint tests"""
    
    def test_get_library_all(self, api_client):
        """GET library with all filter"""
        response = api_client.get(f"{BASE_URL}/api/library?filter_type=all")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_get_library_filtered(self, api_client):
        """GET library with specific filters"""
        filters = ["book", "article", "tv", "movie"]
        for filter_type in filters:
            response = api_client.get(f"{BASE_URL}/api/library?filter_type={filter_type}")
            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            # All items should match filter type
            for item in data:
                assert item["type"] == filter_type

class TestReviews:
    """AI review endpoint tests"""
    
    def test_get_review_empty(self, api_client):
        """GET review for date with no review"""
        test_date = "2026-01-20"
        response = api_client.get(f"{BASE_URL}/api/reviews/{test_date}")
        assert response.status_code == 200
        data = response.json()
        assert data["date"] == test_date
    
    def test_generate_review_no_log_data(self, api_client):
        """POST review generation without log data returns 400"""
        test_date = "2099-12-31"  # Future date with no data
        response = api_client.post(f"{BASE_URL}/api/review/generate", json={"date": test_date})
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "No log data found" in data["detail"]
    
    def test_get_all_reviews(self, api_client):
        """GET all reviews"""
        response = api_client.get(f"{BASE_URL}/api/reviews")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

class TestSettings:
    """Settings endpoint tests"""
    
    def test_get_setting_nonexistent(self, api_client):
        """GET non-existent setting returns null value"""
        response = api_client.get(f"{BASE_URL}/api/settings/test_key_nonexistent")
        assert response.status_code == 200
        data = response.json()
        assert data["key"] == "test_key_nonexistent"
        assert data["value"] is None
    
    def test_update_setting_and_verify(self, api_client):
        """PUT setting and verify with GET"""
        test_key = "TEST_theme"
        test_value = "dark"
        
        # Update setting
        update_response = api_client.put(
            f"{BASE_URL}/api/settings/{test_key}",
            json={"value": test_value}
        )
        assert update_response.status_code == 200
        update_data = update_response.json()
        assert update_data["key"] == test_key
        assert update_data["value"] == test_value
        
        # Verify persistence
        get_response = api_client.get(f"{BASE_URL}/api/settings/{test_key}")
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data["key"] == test_key
        assert get_data["value"] == test_value
