// Todo: handle odd parentage (multiple? etc)

function parseFile(filecontent) {
    try {
        // Try parsing the content
        content = JSON.parse(filecontent);

        // Decide how to parse based on if name is present
        if ("name" in content) {
            return new Profile(null, content);
        } else {
            return new Result(content);
        }
    }
    catch(err) {
        Console.log("Error while parsing:")
        Console.log(err)
        return null;
    }
}