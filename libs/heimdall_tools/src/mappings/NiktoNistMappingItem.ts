class NiktoNistMappingItem {
  id: number
  pluginCategory: string
  nistId: string
  osvdb: number

  constructor(values: string[]) {
    if (values[0] === undefined) {
      throw new Error('Nikto Nist Mapping Data must contain an id.');
    } else {
      this.id = parseInt(values[0])
    }
    if (values[1] === undefined) {
      throw new Error('Nikto Nist Mapping Data must contain a plugin category.');
    } else {
      this.pluginCategory = values[1]
    }
    if (values[2] === undefined) {
      this.nistId = ''
    } else {
      this.nistId = values[2]
    }
    this.osvdb = parseInt(values[3])
  }
}
