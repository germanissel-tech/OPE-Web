/**
 * **Todo lo que esta funcionalidad le dice al operador** (`CU-43`).
 *
 * Una por funcionalidad, y por qué está explicado en el de `merchants`.
 */
export const homeStrings = {
  home: 'Inicio',
  navigates: 'OPE-Console navega',
  menuFromRegistry: 'El menú sale del registro de pantallas',
  menuFromRegistryHelp:
    'Nadie escribió una entrada de menú ni una ruta: las dos se derivan de lo que declara cada ' +
    'pantalla.',
  goToMerchants: 'Ir a merchants',

  about: 'Acerca de OPE-Console',
  notInSideMenu: 'A esta pantalla no se llega por el menú lateral',
  notInSideMenuHelp:
    'Se abre desde el menú de usuario, que la nombra por su declaración y no por su URL: si la ' +
    'ruta cambiara, el enlace no compila. Que no vaya al menú lateral lo dice la propia pantalla, ' +
    'en el mismo lugar donde declara su ruta y su título.',
} as const
