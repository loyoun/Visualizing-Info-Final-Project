// Object to hold hex colors of each typing (according to Bulbapedia's type list)
const TypeColors = {
    "Normal": "#9FA19F",
    "Fighting": "#FF8000",
    "Flying": "#81B9EF",
    "Poison": "#9141CB",
    "Ground": "#915121",
    "Rock": "#AFA981",
    "Bug": "#91A119",
    "Ghost": "#704170",
    "Steel": "#60A1B8",
    "Fire": "#E62829",
    "Water": "#2980EF",
    "Grass": "#3FA129",
    "Electric": "#FAC000",
    "Psychic": "#EF4179",
    "Ice": "#3DCEF3",
    "Dragon": "#5060E1",
    "Dark": "#624D4E",
    "Fairy": "#EF70EF"
};

// Simple function to convert the "Typing" column in the data to an array of strings
// Normally parses as a single string, even with autoType
function convertTypingToArray(pokedex) {
    pokedex.forEach((pokemon) => {
        pokemon["Typing"] = JSON.parse(pokemon["Typing"].replace(/'/g, "\""));
    });
    return pokedex;
}

// Not entirely necessary if there's already an svg in the html 
function setupSVG() {
    var height = 150;
    var width = 450;
    var viewBox = `0 0 ${width} ${height}`;
    var svg;

    if(!(d3.select("svg").empty())) {
        svg = d3.select("#SVGWindow").select("svg");
    }
    else {
        svg = d3.select("#SVGWindow").append("svg")
    }
    
    svg.attr("viewBox", viewBox)
        .attr("id", "Visualization");
    return [width, height];
}

// Create check boxes for each type in global const TypeColors
function createTypeChecks(pokedex) {
    for(var type of Object.keys(TypeColors)) {
        d3.select("#TypeChecks")
            .append("input")
            .attr("type", "checkbox")
            .attr("id", `${type}Type`)
            .attr("class", "typeCheck")
            .property("name", "TypeCheck")
            .property("value", type);
        d3.select("#TypeChecks")
            .append("label")
            .attr("for", `${type}Type`)
            .text(type)
            .style("background-color", TypeColors[type])
            .style("color", "white");
    }
}

// Create check boxes for each generation in pokedex
function createGenerationChecks(pokedex) {
    var generations = [...new Set(pokedex.map(pokemon => pokemon.Generation))];
    for(var generation of generations) {
        d3.select("#GenerationChecks")
            .append("input")
            .attr("type", "checkbox")
            .attr("id", generation)
            .attr("class", "genCheck")
            .property("name", "GenCheck")
            .property("value", generation);
        d3.select("#GenerationChecks")
            .append("label")
            .attr("for", generation)
            .text(generation);
    }
}

// Quick function to call both check creators
function createFilters(pokedex) {
    createTypeChecks(pokedex);
    createGenerationChecks(pokedex);
}

// Filter the passed pokedex based on currently checked type check boxes
function filterTypes(pokedex, e) {
    if(e.id == "SelectAllTypes") {
        d3.selectAll(".typeCheck")
            .property("checked", e.checked);
    }
    // Example of getting property using arrow function and index
    var checkedBoxes = d3.selectAll("input.typeCheck:checked").filter((d, i, node) => node[i].value != "All");
    var typeArr = [];

    // Example of getting property using anonymous function and this
    checkedBoxes.each(function() {
        typeArr.push(this.value)
    });

    typeFilteredPokedex = [];
    typeArr.forEach(function(type) {
        typeFilteredPokedex.push(...pokedex.filter(pokemon => pokemon.Typing.includes(type)));
    });
    return typeFilteredPokedex;
}

// Filter the passed pokedex based on currently checked generation check boxes
function filterGenerations(pokedex, e) {
    if(e.id == "SelectAllGens") {
        d3.selectAll(".genCheck")
            .property("checked", e.checked);
    }
    // Example of getting property using arrow function and index
    var checkedBoxes = d3.selectAll("input.genCheck:checked").filter((d, i, node) => node[i].value != "All");
    var genArr = [];

    // Example of getting property using anonymous function and this
    checkedBoxes.each(function() {
        genArr.push(this.value)
    });

    var genFilteredPokedex = [];
    genArr.forEach(function(gen) {
        genFilteredPokedex.push(...pokedex.filter(pokemon => pokemon.Generation == gen));
    });
    return genFilteredPokedex;
}

// Apply both filters
// This method makes sure all filters are combined
// For example: bug and ghost types in Gens IV and IX
function applyFilters(pokedex, e) {
    if(e.classList.contains("genCheck")) {
        pokedex = filterGenerations(pokedex, e);
        pokedex = filterTypes(pokedex, e);
        visualizeData(pokedex);
    }
    else if(e.classList.contains("typeCheck")) {
        pokedex = filterTypes(pokedex, e);
        pokedex = filterGenerations(pokedex, e);
        visualizeData(pokedex);
    }
}

// Remove infobox element
function closeInfobox() {
    // Assumes infobox already exists for user to click on infobox close
    var infobox = d3.select("#Infobox");
    infobox.selectChildren().remove();
    infobox.remove();
    d3.selectAll(".openedInfobox").each((data, index, node) => d3.select(node[index]).classed("openedInfobox", false));
}

// Create infobox element
function openInfobox() {
    var infobox = d3.select("#SVGWindow")
        .append("div")
        .attr("id", "Infobox")
    infobox.append("div")
        .attr("id", "InfoboxClose")
        .text("X");
    return infobox;
}

// Event handler for infobox listener
function handleInfobox(pokedex, node) {
    var infobox;
    var clicked = d3.select(node);
    // If infobox exists
    if(!(d3.select("#Infobox").empty())) {
        infobox = d3.select("#Infobox");
        // if element that triggered event has class "openedInfobox", close element
        if(clicked.classed("openedInfobox")) {
            closeInfobox();
            clicked.classed("openedInfobox", false);
        }
        // else switch infobox to clicked element
        else {
            closeInfobox();
            infobox = openInfobox();
            clicked.classed("openedInfobox", true);
        }
    }
    // Else Infobox doesn't exist, open infobox
    else {
        infobox = openInfobox();
        clicked.classed("openedInfobox", true);
    }

    // Separate event listener function for closing the infobox
    d3.select("#InfoboxClose").on("click", closeInfobox);

    // Selects pokemon name based on circle's id
    var selectedPokemon = d3.select(node).attr("id");
    // Get object since filter returns an array of all matches
    var pokemon = pokedex.filter(pokemon => pokemon.Name == selectedPokemon)[0];
    // Loop through all properties of object and append them to the infobox
    for(var [key, value] of Object.entries(pokemon)) {
        if(key == "Name") {
            infobox.append("h3")
                .text(key + ": " + value);
        }
        // I don't want to infringe any copyright. Not sure including this counts as fair use.
        // Also only just now realizing I used "Biography" instead of "Biology" in my csv file arghhh
        else if(key == "Biography") {
            continue;
        }
        else if(key == "Height") {
            infobox.append("p")
                .text(key + ": " + value + " meters");
        }
        else if(key == "Weight") {
            infobox.append("p")
                .text(key + ": " + value + " kilograms");
        }
        else if(key == "BST") {
            infobox.append("p")
                .text("Base Stat Total: " + value);
        }
        else {
            infobox.append("p")
                .text(key + ": " + value);
        }
    }
}

// Function to put all the data on the svg
function visualizeData(pokedex) {
    // Setup svg and store returned dimensions
    var svgDimensions = setupSVG();
    var svgWidth = svgDimensions[0];
    var svgHeight = svgDimensions[1];
    var svg = d3.select("#Visualization");

    // Remove all children from svg canvas
    d3.select("svg").selectChildren().remove();

    var padding = 30;

    var heights = pokedex.map(({Height}) => (Height));
    var weights = pokedex.map(({Weight}) => (Weight));
    var bsts = pokedex.map(({BST}) => (BST));

    var x_scale = d3.scaleLinear([0, d3.max(weights)], [padding, svgWidth - padding]);
    var y_scale = d3.scaleLinear([0, d3.max(heights)], [svgHeight - padding, padding]);
    var r_scale = d3.scaleLinear([0, d3.max(bsts)], [0.5, 4]);

    var pokemon_groups = svg
        .selectAll("circle")
        .data(pokedex).enter()
        .append("g")
        .attr("class", "pokemonContainer");

    pokemon_groups.append("circle")
        .attr("cx", pokemon => x_scale(pokemon.Weight))
        .attr("cy", pokemon => y_scale(pokemon.Height))
        .attr("r",  pokemon => r_scale(pokemon.BST))
        .attr("class", pokemon => pokemon.Typing[0] + " " + pokemon.Typing[1] + " pokemon")
        .attr("id", pokemon => pokemon.Name)
        .style("fill", (pokemon) => {
            num = pokemon.N_Dex
            return "url(#" + num + "Gradient)"
        });
    
    // Adding a text label to each circle with the pokemon's name.
    // Will appear on hover due to CSS.
    pokemon_groups.append("text")
        .attr("x", pokemon => x_scale(pokemon.Weight))
        .attr("y", pokemon => y_scale(pokemon.Height))
        .attr("class", "pokemonNames")
        .attr("font-size", 5)
        .text(pokemon => pokemon.Name);
    
    // Adding linear gradients to each circle based on the pokemon's typing
    var lin_grad = pokemon_groups.append("linearGradient")
        .attr("id", pokemon => pokemon.N_Dex + "Gradient");

    lin_grad.append("stop")
        .attr("offset", "33%")
        .attr("stop-color", pokemon => TypeColors[pokemon.Typing[0]]);

    lin_grad.append("stop")
        .attr("offset", "66%")
        .attr("stop-color", (pokemon) => {
            if(pokemon.Typing[1] == undefined) {
                return TypeColors[pokemon.Typing[0]]
            }
            else {
                return TypeColors[pokemon.Typing[1]]
            }
        });
    
    
    // Adding x and y axes to svg
    var x_axis = svg.append("g")
        .attr("class", "axis")
        .attr("id", "XAxis")
        .attr("transform", "translate(0," + (svgHeight - padding) + ")")
        .call(d3.axisBottom(x_scale));

    var y_axis = svg.append("g")
        .attr("class", "axis")
        .attr("id", "YAxis")
        .attr("transform", "translate(" + (padding) + ", 0)")
        .call(d3.axisLeft(y_scale).tickFormat(d3.format(".1f")));

    // Adding gridlines to axes
    d3.selectAll("g#XAxis g.tick")
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("y1", -svgHeight + (padding * 2))
        .attr("x2", 0)
        .attr("y2", 0);

    d3.selectAll("g#YAxis g.tick")
        .append("line")
        .attr("class", "gridline")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", svgWidth - (padding * 2))
        .attr("y2", 0);

    // x-axis label
    svg.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("x", svgWidth / 2)
        .attr("y", svgHeight - 5)
        .text("Weight (Kilograms)");

    // y-axis label
    svg.append("text")
        .attr("class", "axisLabel")
        .attr("text-anchor", "middle")
        .attr("x", -svgHeight / 2)
        .attr("y", 0)
        .attr("dy", "1em")
        .attr("transform", "rotate(-90)")
        .text("Height (Meters)");

    // chart title
    svg.append("text")
        .attr("class", "axisLabel")
        .attr("id", "ChartTitle")
        .attr("text-anchor", "middle")
        .attr("x", svgWidth / 2)
        .attr("y", padding - 10)
        .text("Relationship between Height and Weight for Pokémon");
        
    // Event listener to handle infobox actions
    d3.selectAll(".pokemon").on("click", function() {
        handleInfobox(pokedex, this)
    });
}

// Main function called when d3 loads csv file
function main(data_object) {
    var pokedex = data_object;
    pokedex = convertTypingToArray(pokedex);
    createFilters(pokedex);
    visualizeData(pokedex);


    // Event listener function to apply filters
    d3.selectAll("input").filter((data, index, node) => d3.select(node[index]).attr("type") == "checkbox")
        .on("change", function() {
            applyFilters(pokedex, this);
        }
    );
}

d3.csv("data/full_bulbapedia_pokedex.csv", d3.autoType).then(main);