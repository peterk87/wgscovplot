import {defaultTo} from "lodash/util";
import {genomeCoverage, meanCoverage, medianCoverage} from "./coverageStat";
import {find, map} from "lodash/collection";
import {join} from "lodash/array";

/**
 * Define properties for gene/amplicon feature plot which is in the last index of grid
 * @type {max_grid_height: number, rec_items_height: number, grid_height: string}
 */
export const geneFeaturePlotProperties = {
    "max_grid_height": 80,
    "rec_items_height": 12,
    "grid_height": "15%"
};

/**
 * Dict of color for coloring variant position in the chart
 * @type {Dict[]}
 */
export const ntColor = {
    "A": "#ea5e48",
    "C": "#eaca48",
    "G": "#6ad82b",
    "T": "#2b87d8",
};

/**
 * Define color for flu gene segments
 */
export const segmentsColor = {
    "1_PB2": "#A6CEE3",
    "2_PB1": "#1F78B4",
    "3_PA": "#B2DF8A",
    "4_HA": "#33A02C",
    "5_NP": "#FB9A99",
    "6_NA": "#E31A1C",
    "7_M": "#FDBF6F",
    "8_NS": "#FF7F00"
};

/**
 * Function get Coverage Stat comparison across samples
 * @param {Array<string>} samples - An array of samples name
 * @param {Array<Array<number>>} depths - Array of depths
 * @param {number} start - start position
 * @param {number} end - end position
 * @param {number} low - low coverage threshold
 * @param {string} currentSample - selected sample
 * @param {number} position - Selected position
 * @returns <Array<Array<string>> - Coverage Stat comparison across samples
 */
function getCoverageStatComparison(samples, depths, start, end, low, currentSample, position) {
    let rows = [];
    let tableHeader = ["Sample", "Depth at position " + position.toLocaleString(), "Range", "Mean Coverage (X)", "Median Coverage (X)", `Genome Coverage (>=${low}X) (%)`];
    rows.push(...[tableHeader]);
    for (let [i, sample] of samples.entries()) {
        let meanCov = meanCoverage(depths[i], start, end).toFixed(2);
        let medianCov = medianCoverage(depths[i], start, end).toFixed(2);
        let genomeCov = genomeCoverage(depths[i], start, end, low).toFixed(2);
        let coverageDepth = depths[i][position - 1];
        let row = [sample, coverageDepth.toLocaleString(), start.toLocaleString() + " - " + end.toLocaleString(), meanCov, medianCov, genomeCov];
        rows.push(...[row]);
    }
    return rows;
}

/**
 * Function get Variant Comparison across samples
 * @param {Array<string>} samples - An array of samples name
 * @param {Array<Array<number>>} depths - Array of depths
 * @param {Array<Array<Object>>} variants - The dict of variants data
 * @param {number} position - Variant position
 * @param {string} currentSample - selected sample
 * @returns <Array<Array<string>> - Variant comparison across samples
 */
function getVariantComparison(samples, variants, depths, position, currentSample = "") {
    let rows = [];
    let variantArr = [];
    for (let [i, element] of variants.entries()) {
        if (element.length) {
            let isPOSExist = false;
            let foundObj = find(Object.values(element), {"POS": position});
            if (foundObj !== undefined && foundObj !== null) {
                isPOSExist = true;
                variantArr.push(foundObj);
            }
            if (!isPOSExist) {
                variantArr.push({"sample": samples[i], "POS": position}); // sample has variant infor but no variant infor at this position
            }
        } else {
            variantArr.push({"sample": samples[i], "POS": position}); // sample has no variant information
        }
    }
    var unionKeys = [...new Set(variantArr.reduce((r, e) => [...r, ...Object.keys(e)], []))];
    unionKeys.push("Coverage Depth"); // Add Coverage Depth row
    unionKeys.forEach(key => {
        let row = [];
        row.push(key);
        if (key === "Coverage Depth") {
            for (let i = 0; i < depths.length; i++) {
                row.push(depths[i][position - 1].toLocaleString());
            }
        } else {
            variantArr.forEach(element => {
                if (element[key] !== undefined && element[key] !== null) {
                    if (key === "sample" && element[key] === currentSample) {// Bold highlight selected sample
                        row.push(element[key].bold());
                    } else {
                        row.push(element[key]);
                    }
                } else {
                    row.push("");
                }
            });
        }
        rows.push(...[row]);
    });
    return rows;
}

/**
 * Write tooltip information to HTML table
 * @param {string[]} headers - Header of table
 * @param {Array<Array<string>>} rows - Rows of table
 * @param {string} classes - Classes defined for table
 * @returns {string}
 */
function toTableHtml(headers, rows, classes) {
    let classTable = defaultTo(classes, "table");
    let out = '<table class="' + classTable + '"><thead>';
    out += join(
        map(headers, function (x) {
            return "<strong>" + x + "</strong>";
        }),
        ""
    );
    out += "</thead><tbody>";
    out += join(
        map(rows, function (xs) {
            return (
                "<tr>" +
                join(
                    map(xs, function (x, i) {
                        return "<td " + (i === 0 ? 'scope="row"' : "") + ">" + "<samp>"+x+"</samp>" + "</td>";
                    }),
                    ""
                ) +
                "</tr>"
            );
        }),
        ""
    );
    out += "</tbody></table>";
    return out;
}

/**
 *
 * @param {Array<number>} depths
 * @param {number} threshold
 * @returns The regions in which depth < threshold
 */
function getCoordsInterval(depths, threshold) {
    let coords = [];
    let foundInterval = false;
    let firstCoord, lastCoord;
    let count = 0;
    for (let i = 0; i < depths.length; i++) {
        if (depths[i] < threshold) {
            firstCoord = i - count;
            count += 1;
            foundInterval = true;
            if (i === depths.length - 1) {
                coords.push([firstCoord + 1, firstCoord + count]); // pos in index 1
            }
        } else {
            if (foundInterval === true) {
                coords.push([firstCoord + 1, firstCoord + count]); // pos in index 1
            }
            foundInterval = false;
            count = 0;
        }
    }
    return coords;
}

export {toTableHtml, getVariantComparison, getCoverageStatComparison, getCoordsInterval};