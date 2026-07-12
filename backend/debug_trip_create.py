import os
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from apps.trips.serializers import TripCreateSerializer

payload = {
    'source': 'bvn',
    'destination': 'annd',
    'vehicle': None,
    'driver': None,
    'trip_date': '2026-07-10',
    'arrival_date': '2026-07-12',
    'arrival_km': None,
    'planned_distance_km': 0,
    'cargo_weight_kg': 0,
    'revenue': 0,
    'narration': 'test'
}

s = TripCreateSerializer(data=payload)
valid = s.is_valid()
print('is_valid=', valid)
print('errors=', s.errors)
if valid:
    try:
        trip = s.save(created_by=None)
        print('created trip id', trip.id)
    except Exception as e:
        import traceback
        traceback.print_exc()
        print('save exception:', e)

print('done')
