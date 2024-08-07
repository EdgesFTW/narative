// import * as d3 from "./d3.v7.min.js";
console.log("Starting JS");

const data = (await d3.csv("gpa_by_year.csv")).filter((ele) => {
  if (ele["Year"] === "2024") {
    return false;
  }
  return true;
});

const academic_units_color = {
  "Grainger": "#f59e0b",
  "LAS": "#84cc16",
  "FAA": "#06b6d4",
  "Education": "#3b82f6",
  "Gies": "#a855f7",
  "ACES": "#f43f5e",
  "Other": "#a21caf",
  "iSchool": "#0369a1",
  "Media": "#047857",
  "Applied Health Sciences": "#854d0e",
  "LER": "#991b1b",
  "Vet Med": "#fda4af",
};

function get_gradepoints(course) {
  let value = 0;
  value += course["A+"] * 12 / 3;
  value += course["A"] * 12 / 3;
  value += course["A-"] * 11 / 3;
  value += course["B+"] * 10 / 3;
  value += course["B"] * 9 / 3;
  value += course["B-"] * 8 / 3;
  value += course["C+"] * 7 / 3;
  value += course["C"] * 6 / 3;
  value += course["C-"] * 5 / 3;
  value += course["D+"] * 4 / 3;
  value += course["D"] * 3 / 3;
  value += course["D-"] * 2 / 3;
  value += course["F"] * 0 / 3;
  return value;
}

function create_averages0() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  let svg = d3.select("svg#first-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));

    const pathLength = d3.select("path#" + key.replace(/\s/g, "")).node().getTotalLength();

    d3.select("path#" + key.replace(/\s/g, ""))
      .interrupt()
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
    // .transition()
    // .ease(d3.easeSin)
    // .delay(2000)
    // .duration(4500)
    // .attr("stroke-dashoffset", 0);
  }

  document.querySelector("#first-svg").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("#first-svg").parentNode.children[1]
    .setAttribute("opacity", "0");

  d3.select("#avgs")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#" + key.replace(/\s/g, "")).node().getTotalLength();

        d3.select("path#" + key.replace(/\s/g, ""))
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(4500)
          .attr("stroke-dashoffset", 0);

      }

    })

  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target.parentNode.children[0].setAttribute("opacity", "100")
          entry.target.parentNode.children[1].setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("#avgs");
            button["__on"][0].listener();
          }, 1200);

        }
      }
    });
  });
  observer.observe(document.querySelector('#first-svg'));
}

function create_averages1() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) { academic_units[unit] = []; }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key != "Grainger" && key != "LAS" && key != "Gies") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  let svg = d3.select("svg#first-svg1")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", "avg1" + key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));

    const pathLength = d3.select("path#avg1" + key.replace(/\s/g, "")).node().getTotalLength();

    d3.select("path#avg1" + key.replace(/\s/g, ""))
      .interrupt()
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
    // .transition()
    // .ease(d3.easeSin)
    // .delay(2000)
    // .duration(4500)
    // .attr("stroke-dashoffset", 0);
  }

  document.querySelector("#first-svg1").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("#first-svg1").parentNode.children[1]
    .setAttribute("opacity", "0");

  d3.select("#avgs1")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#avg1" + key.replace(/\s/g, "")).node().getTotalLength();

        d3.select("path#avg1" + key.replace(/\s/g, ""))
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(2500)
          .attr("stroke-dashoffset", 0);
      }
    })


  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target.parentNode.children[0].setAttribute("opacity", "100")
          entry.target.parentNode.children[1].setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("button#avgs1");
            button["__on"][0].listener();
          }, 1200);


          // Annotations
          setTimeout(() => {
            d3.select("svg#first-svg1")
              .append("g")
              .attr("class", "annotation-group")
              .call(d3.annotation()
                .annotations([
                  {
                    note: {
                      label: "Large spike immediately after first full COVID year",
                      bgPadding: 20,
                      title: "LAS"
                    },
                    data: { year: "2020", gpa: 3.375 },
                    subject: { radius: 10 },
                    dy: 75,
                    dx: 80
                  },
                  {
                    note: {
                      label: "Large spike immediately after first full COVID year",
                      bgPadding: 20,
                      title: "Grainger"
                    },
                    data: { year: "2020", gpa: 3.425 },
                    subject: { radius: 10 },
                    dy: -15,
                    dx: 80
                  },
                  {
                    note: {
                      label: "Relatively smaller spike immediately after first full COVID year",
                      bgPadding: 20,
                      title: "Gies"
                    },
                    data: { year: "2020", gpa: 3.67 },
                    subject: { radius: 10 },
                    dy: 95,
                    dx: -40
                  },
                ])
                .type(d3.annotationCalloutCircle)
                .accessors({
                  x: d => x(new Date(d.year)),
                  y: d => y(d.gpa)
                })
              )
          }, 4500);

        }
      }
    });
  });
  observer.observe(document.querySelector('#first-svg1'));

}

function create_lowest() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key != "Grainger" && key != "LAS" && key != "Gies") { continue; } // dont include the other catagory of classes
    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gpa = [];
      }
      let cur_gpa = get_gradepoints(academic_units[key][i]) / academic_units[key][i]["Num Students"];
      year_stats[year].gpa.push(cur_gpa);
    }
    for (let year in year_stats) {
      let cur = year_stats[year].gpa.sort()[0];
      year_stats[year].gpa = cur;
      if (cur < min_gpa) {
        min_gpa = cur;
      }
      if (cur > max_gpa) {
        max_gpa = cur;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa)); // sort and take the min ele


  let svg = d3.select("svg#second-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Minimum Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", "min" + key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));
  }

  document.querySelector("svg#second-svg").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("svg#second-svg").parentNode.children[1]
    .setAttribute("opacity", "0");

  d3.select("button#min")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#min" + key.replace(/\s/g, "")).node().getTotalLength();

        d3.select("path#min" + key.replace(/\s/g, ""))
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(2500)
          .attr("stroke-dashoffset", 0);
      }
    })


  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target
            .parentNode.children[0]
            .setAttribute("opacity", "100")
          entry.target
            .parentNode.children[1]
            .setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("button#min");
            button["__on"][0].listener();
          }, 1200);


          // Annotations
          setTimeout(() => {
            d3.select("svg#second-svg")
              .append("g")
              .attr("class", "annotation-group")
              .call(d3.annotation()
                .annotations([
                  {
                    note: {
                      label: "Lowest GPA of any class in Gies Grainger and LAS",
                      bgPadding: 20,
                      title: "The lowest class GPA"
                    },
                    data: { year: "2021", gpa: 1.2 },
                    subject: { radius: 10 },
                    dy: -15,
                    dx: -80
                  },
                  {
                    note: {
                      label: "Point that shows similarity of worse Grainger and Gies courses",
                      bgPadding: 20,
                      title: "Grainger == Gies"
                    },
                    data: { year: "2017", gpa: 2.1 },
                    subject: { radius: 10 },
                    dy: -20,
                    dx: -35
                  },
                ])
                .type(d3.annotationCalloutCircle)
                .accessors({
                  x: d => x(new Date(d.year)),
                  y: d => y(d.gpa)
                })
              )
          }, 2500);

        }
      }
    });
  });
  observer.observe(document.querySelector('svg#second-svg'));

}

function create_units_streamgraph() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let unit in yearly_academic_units) {
    for (let year in yearly_academic_units[unit]) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let normalized = gradepoints / students; // normalize with respect to all units
      flattenedData.push({
        year: year,
        unit: unit,
        gpps: normalized,
      })
    }
  }

  // renormalize by subtracting off the minumum each year
  for (let year in yearly_academic_units["Grainger"]) {
    let min = 4;
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year && flattenedData[i].gpps < min) {
        min = flattenedData[i].gpps;
      }
    }
    // subtract off min
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year) {
        flattenedData[i].gpps += (0.075 - min);
      }
    }

  }

  // Determine the series that need to be stacked.
  const series = d3.stack()
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)
    .keys(d3.union(flattenedData.map(d => d.unit))) // distinct series keys, in input order
    .value(([, D], key) => D.get(key).gpps) // get value for each series key and stack
    (d3.index(flattenedData, d => d.year, d => d.unit)); // group by stack then series key

  // Prepare the scales for positional and color encodings.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    // .domain(d3.extent(series.flat(2)))
    .domain([d3.min(series.flat(2), (d) => d) - 1.1, d3.max(series.flat(2), (d) => d) + 1.1])
    .rangeRound([height - marginBottom, marginTop]);

  // Construct an area shape.
  const area = d3.area()
    .x(d => x(new Date(d.data[0])))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  let svg = d3.select("svg#third-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 20).tickFormat((d) => Math.abs(d).toLocaleString("en-US")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Difference from minimum average GPA"));

  // Append the x-axis and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.select(".domain").remove());

  // Append a path for each series.
  svg.append("g")
    .selectAll()
    .data(series)
    .join("path")
    .attr("fill", d => academic_units_color[d.key])
    // .attr("fill", d => color(d.key))
    .attr("d", area)
    .append("title")
    .text(d => d.key);

  document.querySelector("svg#third-svg").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("svg#third-svg").parentNode.children[1]
    .setAttribute("opacity", "0");

  // d3.select("button#min")
  //   .on("click", () => {
  //     for (let key in yearly_academic_units) {
  //       const pathLength = d3.select("path#stream" + key.replace(/\s/g, "")).node().getTotalLength();
  //
  //       d3.select("path#min" + key.replace(/\s/g, ""))
  //         .interrupt()
  //         .attr("stroke-dashoffset", pathLength)
  //         .attr("stroke-dasharray", pathLength)
  //         .transition()
  //         .ease(d3.easeSin)
  //         .delay(100)
  //         .duration(2500)
  //         .attr("stroke-dashoffset", 0);
  //     }
  //   })


  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target
            .parentNode.children[0]
            .setAttribute("opacity", "100")
          entry.target
            .parentNode.children[1]
            .setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("button#stream");
            button["__on"][0].listener();
          }, 1200);


          // Annotations
          setTimeout(() => {
            d3.select("svg#third-svg")
              .append("g")
              .attr("class", "annotation-group")
              .call(d3.annotation()
                .annotations([
                  {
                    note: {
                      label: "",
                      bgPadding: 20,
                      title: "Lowest Variation"
                    },
                    data: { year: "2022", gpa: 4.0 },
                    subject: { radius: 10 },
                    dy: -45,
                    dx: -80
                  },
                  {
                    note: {
                      label: "",
                      bgPadding: 20,
                      title: "Highest Variation"
                    },
                    data: { year: "2021", gpa: 5.25 },
                    subject: { radius: 10 },
                    dy: -20,
                    dx: 65
                  },
                ])
                .type(d3.annotationCalloutCircle)
                .accessors({
                  x: d => x(new Date(d.year)),
                  y: d => y(d.gpa)
                })
              )
          }, 500);

        }
      }
    });
  });
  observer.observe(document.querySelector('svg#third-svg'));

}

function create_overall() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);

  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(Number(cur_gradepoints));
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let year in yearly_academic_units["Grainger"]) {
    let total_gradepoints = 0;
    let total_students = 0;
    for (let unit in yearly_academic_units) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      total_gradepoints += gradepoints;
      total_students += students;
    }
    let gpa = total_gradepoints / total_students;
    if (gpa < min_gpa) {
      min_gpa = gpa;
    }
    if (gpa > max_gpa) {
      max_gpa = gpa;
    }
    flattenedData.push({
      year: year,
      gpa: gpa,
    })
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa - 0.01, max_gpa + 0.01], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));

  document.querySelector("#fourth-svg")
    // .parentNode
    // .children[1]
    .setAttribute("opacity", "0");
  let svg = d3.select("svg#fourth-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("University wide average GPA"));

  svg.append("path")
    .attr("id", "overall-line")
    .attr("fill", "none")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 2.5)
    .attr("d", line(flattenedData));

  // Add a circle for each datapoint for tooltip
  svg.append("g")
    .attr("fill", "#1d4ed8")
    .selectAll()
    .data(flattenedData)
    .join("circle")
    .attr("cx", (d) => x(new Date(d.year)))
    .attr("cy", (d) => y(d.gpa))
    .attr("r", "8")
    .attr("id", (d) => "overall-line-" + d.year)
    .on("mouseenter", (_e, d) => {
      let rect = document.getElementById("overall-line-" + d.year).getBoundingClientRect();
      d3.select("#tooltip")
        .style("left", (rect.x - 0) + "px")
        .style("top", (rect.y - 30) + "px")
        .style("visibility", "visible")
        .html("<p>" + Math.round(d.gpa * 1000) / 1000 + "</p>");
    })
    .on("mouseleave", (_e, _d) => {
      d3.select("#tooltip")
        .style("visibility", "hidden");
    });

  d3.select("button#overall-line")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#overall-line").node().getTotalLength();

        d3.select("path#overall-line")
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(2500)
          .attr("stroke-dashoffset", 0);
      }
    })
  // svg.append("path")
  //   .attr("id", "avg1" + key.replace(/\s/g, ""))
  //   .attr("fill", "none")
  //   .attr("stroke", academic_units_color[key])
  //   .attr("stroke-width", 2.5)
  //   .attr("d", line(flattened_year_stats));
  //
  // const pathLength = d3.select("path#avg1" + key.replace(/\s/g, "")).node().getTotalLength();
  //
  // d3.select("path#avg1" + key.replace(/\s/g, ""))
  //   .interrupt()
  //   .attr("stroke-dashoffset", pathLength)
  //   .attr("stroke-dasharray", pathLength)


  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target.setAttribute("opacity", "100")
          setTimeout(() => {
            let button = document.querySelector("button#overall-line");
            button["__on"][0].listener();
          }, 1200);


          // Annotations
          setTimeout(() => {
            d3.select("svg#fourth-svg")
              .append("g")
              .attr("class", "annotation-group")
              .call(d3.annotation()
                .annotations([
                  {
                    note: {
                      label: "The point in which overall GPA begins to drastically increase",
                      bgPadding: 20,
                      title: "Inflection Point"
                    },
                    data: { year: "2019", gpa: 3.334 },
                    subject: { radius: 10 },
                    dy: 15,
                    dx: 80
                  },
                  {
                    note: {
                      label: "The peak seen during covid before we returned to fully in-person classes ",
                      bgPadding: 20,
                      title: "Covid peak campuswide GPA"
                    },
                    data: { year: "2020", gpa: 3.486 },
                    subject: { radius: 10 },
                    dy: 5,
                    dx: -70
                  },
                  {
                    note: {
                      label: "The point with the ",
                      bgPadding: 20,
                      title: "Covid peak campuswide GPA"
                    },
                    data: { year: "2023", gpa: 3.507 },
                    subject: { radius: 10 },
                    dy: 135,
                    dx: -35
                  },
                ])
                .type(d3.annotationCalloutCircle)
                .accessors({
                  x: d => x(new Date(d.year)),
                  y: d => y(d.gpa)
                })
              )
          }, 2500);

        }
      }
    });
  });
  observer.observe(document.querySelector('#fourth-svg'));

}

function createLegends() {
  const width = 928;
  const height = 100;
  const cols = 4;
  const entryWidth = 240;
  const entryHeight = 20;
  const marginTop = 30;
  const marginLeft = 40;

  const legendRadius = 8;

  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) {
      academic_units[unit] = [];
    }
    academic_units[unit].push(data[i]);
  }

  let all_units = [];
  for (let key in academic_units) {
    if (key != "Other") { all_units.push(key) };
  }

  function addToSvg(svg, units) {
    let i = 0;
    for (let key in academic_units) {
      if (!units.includes(key)) { continue; }
      let row = i / cols;
      let col = i % cols;

      svg.append("circle")
        .attr("cx", entryWidth * col + marginLeft)
        .attr("cy", row * entryHeight - legendRadius * 0.7 + marginTop)
        .attr("r", legendRadius)
        .style("fill", academic_units_color[key]);
      svg.append("text")
        .attr("x", entryWidth * col + 30 + marginLeft)
        .attr("y", row * entryHeight + marginTop)
        .text(key)
        .style("font-size", "15px")
        .attr("fill", "currentColor")
      i += 1;
    }
  }

  let first = d3.select("svg#first-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(first, all_units);

  let first1 = d3.select("svg#first-legend1")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(first1, ["Grainger", "Gies", "LAS"]);


  let second = d3.select("svg#second-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(second, ["Grainger", "Gies", "LAS"]);

  let third = d3.select("svg#third-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(third, all_units);

  // let fourth = d3.select("svg#fourth-legend")
  //   .attr("width", width)
  //   .attr("height", height)
  //   .attr("viewBox", [0, 0, width, height])
  //   .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  // addToSvg(fourth, all_units);

  let fifth = d3.select("svg#fifth-legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");
  addToSvg(fifth, all_units);

}

function create_averages_dashboard() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!window.unit_filter.includes(data[i]["Academic Units"].trim().replace(/\s/g, ""))) { continue; }
    if (!window.class_filter.includes(data[i]["Class Level"].trim().replace(/\s/g, ""))) { continue; }
    if (!academic_units[unit]) { academic_units[unit] = []; }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key == "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));


  document.querySelector("svg#fifth-svg").replaceChildren("") // remove existing svg content

  let svg = d3.select("svg#fifth-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("id", "avg-dashboard" + key.replace(/\s/g, ""))
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));

    const pathLength = d3.select("path#avg-dashboard" + key.replace(/\s/g, "")).node().getTotalLength();

    d3.select("path#avg-dashboard" + key.replace(/\s/g, ""))
      .interrupt()
      .attr("stroke-dashoffset", pathLength)
      .attr("stroke-dasharray", pathLength)
    // .transition()
    // .ease(d3.easeSin)
    // .delay(2000)
    // .duration(4500)
    // .attr("stroke-dashoffset", 0);
  }

  document.querySelector("#fifth-svg").parentNode.children[0]
    .setAttribute("opacity", "0");
  document.querySelector("#fifth-svg").parentNode.children[1]
    .setAttribute("opacity", "0");

  window.animate_averages_dashboard = () => {
    for (let key in yearly_academic_units) {
      const pathLength = d3.select("path#avg-dashboard" + key.replace(/\s/g, "")).node().getTotalLength();

      d3.select("path#avg-dashboard" + key.replace(/\s/g, ""))
        .interrupt()
        .attr("stroke-dashoffset", pathLength)
        .attr("stroke-dasharray", pathLength)
        .transition()
        .ease(d3.easeSin)
        .delay(100)
        .duration(2500)
        .attr("stroke-dashoffset", 0);
    }
  }

  d3.select("button#avg-dashboard")
    .on("click", () => {
      for (let key in yearly_academic_units) {
        const pathLength = d3.select("path#avg-dashboard" + key.replace(/\s/g, "")).node().getTotalLength();

        d3.select("path#avg-dashboard" + key.replace(/\s/g, ""))
          .interrupt()
          .attr("stroke-dashoffset", pathLength)
          .attr("stroke-dasharray", pathLength)
          .transition()
          .ease(d3.easeSin)
          .delay(100)
          .duration(2500)
          .attr("stroke-dashoffset", 0);
      }
    })


  // from stack overflow
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.getAttribute("opacity") == 0) {
          entry.target.parentNode.children[0].setAttribute("opacity", "100")
          entry.target.parentNode.children[1].setAttribute("opacity", "100")
          setTimeout(() => {
            // let button = document.querySelector("button#avg-dashboard");
            // button["__on"][0].listener();
            window.animate_averages_dashboard();
          }, 1200);
        }
      }
    });
  });
  observer.observe(document.querySelector("svg#fifth-svg"));

}

function create_lowest_dashboard() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!academic_units[unit]) { academic_units[unit] = []; }
    if (!window.unit_filter.includes(data[i]["Academic Units"].trim().replace(/\s/g, ""))) { continue; }
    if (!window.class_filter.includes(data[i]["Class Level"].trim().replace(/\s/g, ""))) { continue; }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  for (let key in academic_units) {
    if (key == "Other") { continue; } // dont include the other catagory of classes
    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gpa = [];
      }
      let cur_gpa = get_gradepoints(academic_units[key][i]) / academic_units[key][i]["Num Students"];
      year_stats[year].gpa.push(cur_gpa);
    }
    for (let year in year_stats) {
      let cur = year_stats[year].gpa.sort()[0];
      year_stats[year].gpa = cur;
      if (cur < min_gpa) {
        min_gpa = cur;
      }
      if (cur > max_gpa) {
        max_gpa = cur;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa, max_gpa], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa)); // sort and take the min ele

  document.querySelector("svg#sixth-svg").replaceChildren("") // remove existing svg content

  let svg = d3.select("svg#sixth-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Minimum Average GPA"));

  for (let key in yearly_academic_units) {
    let flattened_year_stats = [];
    for (let year in yearly_academic_units[key]) {
      flattened_year_stats.push(yearly_academic_units[key][year]);
    }

    svg.append("path")
      .attr("fill", "none")
      .attr("stroke", academic_units_color[key])
      .attr("stroke-width", 2.5)
      .attr("d", line(flattened_year_stats));
  }
}

function create_units_streamgraph_dashboard() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!window.unit_filter.includes(data[i]["Academic Units"].trim().replace(/\s/g, ""))) { continue; }
    if (!window.class_filter.includes(data[i]["Class Level"].trim().replace(/\s/g, ""))) { continue; }
    if (!academic_units[unit]) { academic_units[unit] = []; }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(cur_gradepoints);
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
      if (cur_gpa < min_gpa) {
        min_gpa = cur_gpa;
      }
      if (cur_gpa > max_gpa) {
        max_gpa = cur_gpa;
      }
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let unit in yearly_academic_units) {
    for (let year in yearly_academic_units[unit]) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let normalized = gradepoints / students; // normalize with respect to all units
      flattenedData.push({
        year: year,
        unit: unit,
        gpps: normalized,
      })
    }
  }

  // renormalize by subtracting off the minumum each year
  for (let year in yearly_academic_units["Grainger"]) {
    let min = 4;
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year && flattenedData[i].gpps < min) {
        min = flattenedData[i].gpps;
      }
    }
    // subtract off min
    for (let i = 0; i < flattenedData.length; i++) {
      if (flattenedData[i].year == year) {
        flattenedData[i].gpps += (0.075 - min);
      }
    }

  }

  // Determine the series that need to be stacked.
  const series = d3.stack()
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut)
    .keys(d3.union(flattenedData.map(d => d.unit))) // distinct series keys, in input order
    .value(([, D], key) => D.get(key).gpps) // get value for each series key and stack
    (d3.index(flattenedData, d => d.year, d => d.unit)); // group by stack then series key

  // Prepare the scales for positional and color encodings.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  const y = d3.scaleLinear()
    .domain([d3.min(series.flat(2), (d) => d), d3.max(series.flat(2), (d) => d) * 1.1])
    // .domain([-0.05, d3.max(series.flat(2), (d) => d) * 1.1])
    .rangeRound([height - marginBottom, marginTop]);

  // Construct an area shape.
  const area = d3.area()
    .x(d => x(new Date(d.data[0])))
    .y0(d => y(d[0]))
    .y1(d => y(d[1]));

  document.querySelector("svg#seventh-svg").replaceChildren("") // remove existing svg content

  let svg = d3.select("svg#seventh-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 20).tickFormat((d) => Math.abs(d).toLocaleString("en-US")))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Difference from minimum average GPA"));

  // Append the x-axis and remove the domain line.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).tickSizeOuter(0))
    .call(g => g.select(".domain").remove());

  // Append a path for each series.
  svg.append("g")
    .selectAll()
    .data(series)
    .join("path")
    .attr("fill", d => academic_units_color[d.key])
    // .attr("fill", d => color(d.key))
    .attr("d", area)
    .append("title")
    .text(d => d.key);
}

function create_overall_dashboard() {
  const width = 928;
  const height = 500;
  const marginTop = 30;
  const marginRight = 30;
  const marginBottom = 40;
  const marginLeft = 40;

  let max_gpa = 0;
  let min_gpa = 4;

  // Data generation
  let academic_units = {};
  for (let i = 0; i < data.length; i++) {
    let unit = data[i]["Academic Units"];
    if (!window.unit_filter.includes(data[i]["Academic Units"].trim().replace(/\s/g, ""))) { continue; }
    if (!window.class_filter.includes(data[i]["Class Level"].trim().replace(/\s/g, ""))) { continue; }
    if (!academic_units[unit]) { academic_units[unit] = []; }
    academic_units[unit].push(data[i]);
  }

  let yearly_academic_units = {};
  let total_students = 0;
  for (let key in academic_units) {
    if (key === "Other") { continue; } // dont include the other catagory of classes

    let year_stats = {};
    for (let i = 0; i < academic_units[key].length; i++) {
      let year = academic_units[key][i]["Year"];
      if (!year_stats[year]) {
        year_stats[year] = {};
        year_stats[year].year = year;
        year_stats[year].gradepoints = [];
        year_stats[year].students = [];
      }
      let cur_gradepoints = get_gradepoints(academic_units[key][i]);
      year_stats[year].gradepoints.push(Number(cur_gradepoints));
      year_stats[year].students.push(Number(academic_units[key][i]["Num Students"]));
      total_students += Number(academic_units[key][i]["Num Students"]);
    }

    for (let year in year_stats) {
      let cur_gradepoints = year_stats[year].gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_students = year_stats[year].students.reduce((e1, e2) => { return e1 + e2 }, 0);
      let cur_gpa = cur_gradepoints / cur_students;
      year_stats[year].gpa = cur_gpa;
    }
    yearly_academic_units[key] = year_stats;
  }

  let flattenedData = [];
  for (let year in Object.values(yearly_academic_units)[0]) {
    let total_gradepoints = 0;
    let total_students = 0;
    for (let unit in yearly_academic_units) {
      let ele = yearly_academic_units[unit][year];
      let gradepoints = ele.gradepoints.reduce((e1, e2) => { return e1 + e2 }, 0);
      let students = ele.students.reduce((e1, e2) => { return e1 + e2 }, 0);
      total_gradepoints += gradepoints;
      total_students += students;
    }
    let gpa = total_gradepoints / total_students;
    if (gpa < min_gpa) {
      min_gpa = gpa;
    }
    if (gpa > max_gpa) {
      max_gpa = gpa;
    }
    flattenedData.push({
      year: year,
      gpa: gpa,
    })
  }

  // Declare the x (horizontal position) scale.
  const x = d3.scaleUtc([new Date("2010"), new Date("2023")], [marginLeft, width - marginRight]);

  // Declare the y (vertical position) scale.
  const y = d3.scaleLinear([min_gpa - 0.01, max_gpa + 0.01], [height - marginBottom, marginTop]);

  // Declare the line generator.
  const line = d3.line()
    .x(d => x(new Date(d.year)))
    .y(d => y(d.gpa));

  document.querySelector("svg#eighth-svg").replaceChildren("") // remove existing svg content

  let svg = d3.select("svg#eighth-svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");;

  // Add the x-axis.
  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))
    .call(g => g.append("text")
      .attr("x", width / 2)
      .attr("y", marginBottom / 1.5)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("Average GPA"));

  // Add the y-axis, remove the domain line, add grid lines and a label.
  svg.append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll(".tick line").clone()
      .attr("x2", width - marginLeft - marginRight)
      .attr("stroke-opacity", 0.1))
    .call(g => g.append("text")
      .attr("x", -marginLeft)
      .attr("y", 10)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .text("University wide average GPA"));

  svg.append("path")
    .attr("fill", "none")
    .attr("stroke", "#1d4ed8")
    .attr("stroke-width", 2.5)
    .attr("d", line(flattenedData));

  // Add a circle for each datapoint for tooltip
  svg.append("g")
    .attr("opacity", "1.0")
    .attr("fill", "#1e3a8a")
    .selectAll()
    .data(flattenedData)
    .join("circle")
    .attr("cx", (d) => x(new Date(d.year)))
    .attr("cy", (d) => y(d.gpa))
    .attr("r", "8")
    .attr("id", (d) => "overall-line-" + d.year)
    .on("mouseenter", (_e, d) => {
      let rect = document.getElementById("overall-line-" + d.year).getBoundingClientRect();
      d3.select("#tooltip")
        .style("left", (rect.x - 0) + "px")
        .style("top", (rect.y - 30) + "px")
        .style("visibility", "visible")
        .html("<p>" + Math.round(d.gpa * 1000) / 1000 + "</p>");
    })
    .on("mouseleave", (_e, _d) => {
      d3.select("#tooltip")
        .style("visibility", "hidden");
    });
}

function create_dashboard() {

  window.unit_filter = [];
  document.getElementById("column-1").childNodes.forEach((ele) => {
    let str = ele.textContent.trim().replace(/\s/g, "");
    let box = ele.firstChild;
    if (box != null && ele.firstChild.checked) {
      unit_filter.push(str);
    }

  });
  unit_filter = unit_filter.filter((e) => e != "");

  // window.class_filter = ["100", "200", "300", "400", "500"];
  window.class_filter = [];
  document.getElementById("column-2").childNodes.forEach((ele) => {
    let str = ele.textContent.trim().replace(/\s/g, "");
    let box = ele.firstChild;
    if (box != null && ele.firstChild.checked) {
      window.class_filter.push(str);
    }

  });
  class_filter = class_filter.filter((e) => e != "");

  create_averages_dashboard();
  create_lowest_dashboard();
  create_units_streamgraph_dashboard();
  create_overall_dashboard();
}

createLegends();
create_averages1();
create_lowest();
create_units_streamgraph();
create_overall();

create_dashboard();

document.getElementById("column-1").childNodes.forEach((ele) => {
  let box = ele.firstChild;
  if (box == null) { return; }
  box.addEventListener("click", create_dashboard);
})

document.getElementById("column-2").childNodes.forEach((ele) => {
  let box = ele.firstChild;
  if (box == null) { return; }
  box.addEventListener("click", create_dashboard);
})


document.querySelector("#loading-spinner").parentElement.remove();
document.querySelector("#blur").classList.remove("blur");
console.log("Setup Complete")


