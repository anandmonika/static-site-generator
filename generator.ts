require("dotenv").config();
const express = require('express');
const axios = require('axios');
const { Eta } = require('eta');
const path = require('path');
const fs = require('fs/promises');
const { create } = require("domain");

const eta = new Eta({ views: path.join(__dirname, "templates") });

type Page = {
    link: string;
    title: string;
}

type Activity = {
    activity: string,
    type: string,
    participatns: number,
    price: number,
    link: string,
    key: string,
    accessibility: number
}
    
async function generate() {
    let pageCount: number = Number(process.argv[2]);

    if(pageCount) console.log(`Page count given: ${pageCount}, proceeding...`)
    else {
        pageCount = 10;
        console.log(`Page count not given, proceeding with default page count: ${pageCount}`);
    } 

    console.log('\nDeleting: build folder')
    await deleteBuildFolder();
    
    console.log('Creating: build folder')
    await createBuildFolder();
    
    const pages: Page[] = [];
    console.log('\nReady to generate page')

    for(let i=0; i<pageCount; i++) {
        console.log(`Generating: Page ${i+1}`)
        const response = await getActivityData();
        const activity: Activity = response.data;
        const pageHtml: string = eta.render("./main", activity);
        const fileName = `page-${i+1}.html`;
        await fs.writeFile(`${__dirname}/build/pages/${fileName}`, pageHtml);
        pages.push({ link: `pages/${fileName}`, title: `Page ${i+1}: ${activity.activity}`})
    }

    console.log(`\nGenerating: Index Page`)
    const indexPageHtml: string = eta.render("./index", { pages });
    await fs.writeFile(`${__dirname}/build/index.html`, indexPageHtml);
    console.log('\nAll done! Open the index page')
}   

async function deleteBuildFolder() {
    return fs.rm('build', { recursive: true, force: true });
}

async function createBuildFolder() {
    await fs.mkdir('build');
    await fs.mkdir('build/public');
    await fs.mkdir('build/pages');
    await fs.mkdir('build/public/images')
    await fs.cp('./src/style.css', './build/public/style.css');
    await fs.cp('./src/image', './build/public/images', { recursive: true })
}

async function getActivityData() {
    return axios.get('https://www.boredapi.com/api/activity');
}

generate();
