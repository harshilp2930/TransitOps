import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.reports.views import export_csv, export_pdf
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()
client = APIClient()
user = User.objects.first()
client.force_authenticate(user=user)

def test_csv():
    response = client.get('/api/v1/reports/export.csv')
    print("CSV Status:", response.status_code)
    if response.status_code == 500:
        print("CSV error:", response.content)

test_csv()
