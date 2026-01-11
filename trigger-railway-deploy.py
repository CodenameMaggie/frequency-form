#!/usr/bin/env python3
import json
import urllib.request
import os

# Read Railway token
with open(os.path.expanduser('~/.railway/config.json')) as f:
    config = json.load(f)
    token = list(config.values())[0]

# Get service ID from project
project_id = 'a9196257-b118-47b7-9187-a2a6f9778fec'
env_id = '349cf797-c3e3-47a2-88ca-486b940adf7b'

# First, get the actual service ID
query = {
    'query': f'''
    {{
      project(id: "{project_id}") {{
        services {{
          edges {{
            node {{
              id
              name
            }}
          }}
        }}
      }}
    }}
    '''
}

req = urllib.request.Request(
    'https://backboard.railway.app/graphql/v2',
    data=json.dumps(query).encode(),
    headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
)

try:
    with urllib.request.urlopen(req) as response:
        data = json.load(response)
        print(json.dumps(data, indent=2))

        # Find the service
        if 'data' in data and data['data']['project']:
            services = data['data']['project']['services']['edges']
            for service in services:
                service_id = service['node']['id']
                service_name = service['node']['name']
                print(f"\nFound service: {service_name} (ID: {service_id})")

                # Trigger redeploy
                redeploy_query = {
                    'query': f'''
                    mutation {{
                      serviceInstanceRedeploy(
                        environmentId: "{env_id}"
                        serviceId: "{service_id}"
                      ) {{
                        id
                      }}
                    }}
                    '''
                }

                redeploy_req = urllib.request.Request(
                    'https://backboard.railway.app/graphql/v2',
                    data=json.dumps(redeploy_query).encode(),
                    headers={
                        'Authorization': f'Bearer {token}',
                        'Content-Type': 'application/json'
                    }
                )

                with urllib.request.urlopen(redeploy_req) as redeploy_response:
                    redeploy_data = json.load(redeploy_response)
                    print(f"Redeploy response: {json.dumps(redeploy_data, indent=2)}")

except Exception as e:
    print(f"Error: {e}")
