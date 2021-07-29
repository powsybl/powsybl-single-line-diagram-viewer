async function fetchAndDecode (svg) {
  try {
    const response = await fetch(svg)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.text()
  } catch (e) {
    console.log(e)
  }
}

export default fetchAndDecode
