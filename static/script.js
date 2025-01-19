document.addEventListener('DOMContentLoaded', function() {
    // Función para obtener la ubicación del usuario
    function obtenerUbicacion() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(mostrarUbicacion, manejarError);
        } else {
            alert("La geolocalización no es soportada por este navegador.");
        }
    }

    // Función para mostrar la ubicación en un mapa y las coordenadas
    function mostrarUbicacion(posicion) {
        var latitud = posicion.coords.latitude;
        var longitud = posicion.coords.longitude;

        // Llama a la función para inicializar el mapa con las coordenadas obtenidas
        initMap(latitud, longitud);
    }

    // Función para manejar errores de geolocalización
    function manejarError(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED:
                alert("El usuario denegó el permiso para obtener la ubicación.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("La información de ubicación no está disponible.");
                break;
            case error.TIMEOUT:
                alert("Se ha agotado el tiempo de espera para obtener la ubicación.");
                break;
            case error.UNKNOWN_ERROR:
                alert("Ocurrió un error desconocido al obtener la ubicación.");
                break;
        }
    }

    // Función para inicializar el mapa con las coordenadas proporcionadas
    function initMap(latitud, longitud) {
        // Inicializa el mapa con las coordenadas proporcionadas
        var map = L.map('map').setView([latitud, longitud], 13);

        // Carga los azulejos (tiles) de OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);
        var rojoIcono = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitud}&lon=${longitud}&format=json`)
        .then(response => response.json())
        .then(data => {
            // Crea el contenido del popup con la dirección obtenida
            var popupContent = `Ubicación actual:<br>Dirección: ${data.display_name}`;
            
            // Añade un marcador en la ubicación proporcionada con el contenido del popup
            L.marker([latitud, longitud],{ icon: rojoIcono }).addTo(map)
                .bindPopup(popupContent)
                .openPopup();
        })

        // Consulta puntos de interés cercanos utilizando la API Overpass de OpenStreetMap
        var tiposDeLugares = [
            'museum', 
            'shop=*', 
            'place_of_worship', 
            'amenity=cafe', 
            'amenity=restaurant', 
            'shop=supermarket', 
            'tourism=hotel', 
            'leisure=park', 
            'historic=monument', 
            'natural=beach',
            'amenity=bank',
            'amenity=cinema',
            'amenity=hospital',
            'amenity=school',
            'amenity=university',
            'amenity=library',
            'amenity=police',
            'amenity=post_office',
            'amenity=pub',
            'amenity=bicycle_parking',
            'highway=bus_stop',
            'railway=station',
            'tourism=artwork',
            'tourism=attraction',
            'tourism=viewpoint',
            'tourism=zoo',
            'leisure=garden',
            'leisure=stadium',
            'leisure=swimming_pool',
            'historic=castle',
            'natural=forest',
            'natural=water',
            'landuse=residential',
            'landuse=industrial',
            'landuse=cemetery'
        ];
         // Puedes ajustar los tipos de lugares según tus necesidades
         tiposDeLugares.forEach(tipo => {
            obtenerLugaresCercanos(latitud, longitud, tipo, 2000) // Cambia el radio según sea necesario
                .then(lugares => {
                    lugares.forEach(lugar => {
                        // Verificar si el nombre del lugar está definido
                        if (lugar.tags.name !== undefined) {
                            var distancia = calcularDistancia(latitud, longitud, lugar.lat, lugar.lon);
                            var popupContent = `<b>${lugar.tags.name}</b><br>Distancia: ${distancia.toFixed(2)} metros<br>${lugar.tags.addr ? lugar.tags.addr : ''}`;
                            
                            // Agregar enlace a la página web si está disponible
                            if (lugar.tags.website) {
                                popupContent += `<br><a href="${lugar.tags.website}" target="_blank">Página web</a>`;
                            }
                            
                            // Agregar el nombre del lugar al contenedor en el HTML
                            var placesContainer = document.getElementById('places');
                            var placeElement = document.createElement('div');
                            placeElement.classList.add('place');
                            placeElement.innerHTML = `<b>${lugar.tags.name}</b><br>Distancia: ${distancia.toFixed(2)} metros<br>${lugar.tags.addr ? lugar.tags.addr : ''}`;
                            if (lugar.tags.website) {
                                var websiteLink = document.createElement('a');
                                websiteLink.href = lugar.tags.website;
                                websiteLink.target = '_blank';
                                websiteLink.textContent = 'Página web';
                                placeElement.appendChild(document.createElement('br'));
                                placeElement.appendChild(websiteLink);
                            }
                            placesContainer.appendChild(placeElement);
                            
                            L.marker([lugar.lat, lugar.lon]).addTo(map)
                                .bindPopup(popupContent);
                        }
                    });
                })
                .catch(error => {
                    console.error('Error al obtener lugares cercanos:', error);
                });
        });
    }

    // Función para obtener lugares cercanos de un tipo específico dentro de un radio específico
    function obtenerLugaresCercanos(latitud, longitud, tipo, radio) {
        var url = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radio},${latitud},${longitud})[${tipo}];out;`;

        return fetch(url)
            .then(response => response.json())
            .then(data => {
                return data.elements;
            });
    }

    // Función para calcular la distancia entre dos puntos geográficos
    function calcularDistancia(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radio de la Tierra en kilómetros
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c * 1000; // Distancia en metros
        return d;
    }

    // Llama a la función para obtener la ubicación cuando se carga la página
    obtenerUbicacion();
});


