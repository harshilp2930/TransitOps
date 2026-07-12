"""Business rule test script — run from project root."""
import urllib.request, json, sys

BASE = 'http://localhost:8000/api/v1'


def req(method, url, data=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(BASE + url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


def check(condition, msg_pass, msg_fail):
    if condition:
        print("  PASS:", msg_pass)
    else:
        print("  FAIL:", msg_fail)
        sys.exit(1)


print("=== TransitOps Business Rule Test Suite ===\n")

# Login as dispatcher
status, resp = req('POST', '/auth/login/', {'email': 'dispatcher@transitops.com', 'password': 'transitops123'})
token = resp['access']
print("LOGIN:", status)

# Login as fleet manager
fstatus, fresp = req('POST', '/auth/login/', {'email': 'fleet@transitops.com', 'password': 'transitops123'})
ftoken = fresp['access']

# BR1: Duplicate reg number
status, resp = req('POST', '/vehicles/', {
    'registration_number': 'AU12AB4891',
    'name_model': 'Test', 'type': 'Van',
    'max_load_capacity_kg': 500, 'acquisition_cost': 10000
}, ftoken)
print("BR1 Duplicate Reg:", status, resp.get('registration_number', [''])[0] if isinstance(resp.get('registration_number'), list) else resp)
check(status == 400, "Duplicate reg blocked", "Expected 400")

# BR2: Available vehicles
status, avail_v = req('GET', '/vehicles/available/', token=token)
regs = [v['registration_number'] for v in avail_v]
print("BR2 Available Vehicles:", regs)
check('AU12AB4893' not in regs, "In Shop excluded from pool", "In Shop vehicle in pool!")
check('AU40AB4893' not in regs, "Retired excluded from pool", "Retired vehicle in pool!")

# BR3: Available drivers
status, avail_d = req('GET', '/drivers/available/', token=token)
names = [d['name'] for d in avail_d]
print("BR3 Available Drivers:", names)
check('Rajesh Singh' not in names, "Expired license excluded", "Expired driver in pool!")
check('Priya Sharma' not in names, "Suspended excluded", "Suspended driver in pool!")

vid = avail_v[0]['id']
did = avail_d[0]['id']
vmax = avail_v[0]['max_load_capacity_kg']
print("Using vid=%s did=%s vmax=%s" % (vid, did, vmax))

# BR5: Cargo overload
status, trip = req('POST', '/trips/', {
    'source': 'A', 'destination': 'B', 'vehicle': vid, 'driver': did,
    'cargo_weight_kg': 99999, 'planned_distance_km': 100, 'revenue': 1000
}, token)
tid = trip['id']
status, resp = req('POST', '/trips/' + str(tid) + '/dispatch/', token=token)
print("BR5 Overload Block:", status, resp.get('detail', ''))
check(status == 400 and 'Capacity exceeded' in resp.get('detail', ''), "Overload blocked", "Not blocked!")

# BR6: Dispatch valid trip
status, trip2 = req('POST', '/trips/', {
    'source': 'Mumbai', 'destination': 'Pune',
    'vehicle': vid, 'driver': did,
    'cargo_weight_kg': 100, 'planned_distance_km': 150, 'revenue': 5000
}, token)
t2id = trip2['id']
status, resp = req('POST', '/trips/' + str(t2id) + '/dispatch/', token=token)
print("BR6 Dispatch:", status, "status=" + str(resp.get('status')))
check(status == 200 and resp['status'] == 'Dispatched', "Trip dispatched", "Dispatch failed!")

# BR4: Double-booking
status, trip3 = req('POST', '/trips/', {
    'source': 'X', 'destination': 'Y', 'vehicle': vid, 'driver': did,
    'cargo_weight_kg': 50, 'planned_distance_km': 20, 'revenue': 500
}, token)
t3id = trip3['id']
status, resp = req('POST', '/trips/' + str(t3id) + '/dispatch/', token=token)
print("BR4 Double Booking:", status, resp.get('detail', ''))
check(status == 400 and 'On Trip' in resp.get('detail', ''), "Double-booking blocked", "Not blocked!")

# BR8: Cancel and restore
status, resp = req('POST', '/trips/' + str(t2id) + '/cancel/', token=token)
print("BR8 Cancel:", status, "status=" + str(resp.get('status')))
check(status == 200 and resp['status'] == 'Cancelled', "Cancelled", "Cancel failed!")
status, vstate = req('GET', '/vehicles/' + str(vid) + '/', token=token)
status, dstate = req('GET', '/drivers/' + str(did) + '/', token=token)
print("BR8 Restore: vehicle=%s driver=%s" % (vstate['status'], dstate['status']))
check(vstate['status'] == 'Available', "Vehicle restored", "Vehicle NOT restored!")
check(dstate['status'] == 'Available', "Driver restored", "Driver NOT restored!")

# BR7: Complete
status, resp = req('POST', '/trips/' + str(t2id) + '/dispatch/', token=token)
check(status == 200, "Re-dispatched for complete test", "Re-dispatch failed!")
status, resp = req('POST', '/trips/' + str(t2id) + '/complete/', {
    'final_odometer_km': 74200, 'fuel_consumed_l': 15.5, 'fuel_cost': 2015
}, token)
print("BR7 Complete:", status, "status=" + str(resp.get('status')))
check(status == 200 and resp['status'] == 'Completed', "Completed", "Complete failed!")
status, fuellogs = req('GET', '/fuel-logs/', token=token)
print("BR7 Auto Fuel Log:", len(fuellogs), "logs")
check(len(fuellogs) > 0, "Fuel log auto-created", "No fuel log!")

# BR9: Maintenance → vehicle = In Shop
van06_id = next(v['id'] for v in (req('GET', '/vehicles/', token=token)[1])['results'] if v['registration_number'] == 'KA05CD5678')
fmHeaders = ftoken  # using ftoken for maintenance
from datetime import date
status, maint = req('POST', '/maintenance/', {
    'vehicle_id': van06_id, 'service_type': 'Brake Service',
    'cost': 5000, 'date': str(date.today()), 'notes': 'Test'
}, ftoken)
print("BR9 Maintenance Create:", status, "status=" + str(maint.get('status')))
check(status == 201 and maint.get('status') == 'In Shop', "Maintenance created", "Failed!")
status, vstate = req('GET', '/vehicles/' + str(van06_id) + '/', token=token)
print("BR9 Vehicle after open maint:", vstate['status'])
check(vstate['status'] == 'In Shop', "Vehicle set to In Shop", "Vehicle NOT In Shop!")

# BR10: Close maintenance → vehicle = Available
mid = maint['id']
status, resp = req('PATCH', '/maintenance/' + str(mid) + '/close/', token=ftoken)
print("BR10 Close Maintenance:", status, "status=" + str(resp.get('status')))
check(status == 200 and resp['status'] == 'Completed', "Maintenance closed", "Close failed!")
status, vstate = req('GET', '/vehicles/' + str(van06_id) + '/', token=token)
print("BR10 Vehicle after close maint:", vstate['status'])
check(vstate['status'] == 'Available', "Vehicle restored to Available", "Vehicle NOT Available!")

print("\n=== ALL 10 BUSINESS RULES VERIFIED ===")
