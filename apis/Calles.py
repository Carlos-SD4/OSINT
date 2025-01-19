import requests
import geopy.distance
api_key = '4cac806f6642445fbe478e8fa87c92cd'

def obtener_coordenadas(direccion):
    api_key = '4cac806f6642445fbe478e8fa87c92cd'
    url = f'https://api.opencagedata.com/geocode/v1/json?q={direccion}&key={api_key}'
    response = requests.get(url)
    data = response.json()

    if response.status_code == 200 and data['total_results'] > 0:
        latitud = data['results'][0]['geometry']['lat']
        longitud = data['results'][0]['geometry']['lng']
        return latitud, longitud
    else:
        print("No se pudo obtener la geolocalización.")
        return None


def lugares_cercanos(latitud, longitud):
    rango = 200
    overpass_url = f'https://lz4.overpass-api.de/api/interpreter?data=[out:json];(node(around:{rango},{latitud},{longitud}););out;'
    response = requests.get(overpass_url)
    data = response.json()

    if response.status_code == 200 and 'elements' in data:
        pois = []
        for element in data['elements']:
            if 'tags' in element and 'name' in element['tags']:
                pois.append(element['tags']['name'])
        return pois
    else:
        print("No se pudieron obtener lugares cercanos utilizando OSINT.")
        return None


def obtener_ubicacion_por_ip():
    try:
        response = requests.get('https://ipinfo.io/json')
        data = response.json()

        if response.status_code == 200:
            ubicacion = data.get('loc')
            if ubicacion:
                latitud, longitud = ubicacion.split(',')
                return float(latitud), float(longitud)
    except Exception as e:
        print(f"Error al obtener la ubicación por IP: {e}")
    return None


coordenadas = obtener_ubicacion_por_ip()
if coordenadas:
    print(f"Las coordenadas de tu ubicación son: {coordenadas}")
    lugares = lugares_cercanos(coordenadas[0], coordenadas[1])
    if lugares:
        print("Lugares cercanos encontrados utilizando OSINT:")
        for lugar in lugares:
            print(lugar)
    else:
        print("No se encontraron lugares cercanos.")
else:
    print("No se pudo obtener la ubicación por IP.")







