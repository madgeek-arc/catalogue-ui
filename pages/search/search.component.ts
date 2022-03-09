import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {FormBuilder, FormGroup} from "@angular/forms";
import {Subscription} from "rxjs";
import {Paging} from '../../domain/paging';
import {URLParameter} from '../../domain/url-parameter';
import {PremiumSortFacetsPipe} from '../../shared/pipes/premium-sort.pipe';
import {SearchService} from "../../services/search.service";


@Component({
  selector: 'app-search',
  templateUrl: './search.component.html',
  providers: [SearchService]
  // styleUrls: ['../../../lib/pages/search/search.component.css']
})

export class SearchComponent implements OnInit {
  private sortFacets = new PremiumSortFacetsPipe();
  canAddOrEditService: boolean;
  // myProviders:  Provider[] = [];
  sub: Subscription;
  urlParameters: URLParameter[] = [];
  advanced = false;
  foundResults = true;
  errorMessage: string;
  searchForm: FormGroup;
  itemPath = '/service/'

  searchResults: Paging<Object>;
  facetOrder = ['category', 'trl', 'lifeCycleStatus', 'provider'];

  //Paging
  pageSize = 10;
  totalPages = 0;
  currentPage = 1;
  pageTotal: number;
  pages: number[] = [];
  offset = 2;

  loading = false;

  showSearchFieldDropDown = true;
  searchFields: string[] = ['name', 'publisher', 'source'];
  filtersMobileShown = false;

  constructor(public fb: FormBuilder, public route: ActivatedRoute, public searchService: SearchService,
              // public authenticationService: AuthenticationService,
              public router: Router) {
    this.searchForm = fb.group({'query': [''], 'searchFields': ['']});
  }

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      this.urlParameters.splice(0, this.urlParameters.length);
      this.foundResults = true;
      for (const obj in params) {
        if (params.hasOwnProperty(obj)) {
          const urlParameter: URLParameter = {
            key: obj,
            values: params[obj].split(',')
          };
          this.urlParameters.push(urlParameter);
        }
      }

      // request results from the registry
      // this.loading = true; // Uncomment for spinner
      return this.searchService.searchSnippets(this.urlParameters).subscribe(
        searchResults => {
          // console.log(searchResults);
          this.updateSearchResultsSnippets(searchResults);
        },
        error => {},
        () => {
          this.paginationInit();
          this.loading = false;
        }
      );
    });
  }

  onSubmit(searchValue: string) {
    /*let params = Object.assign({},this.activatedRoute.children[0].snapshot.params);
    params['query'] = searchValue.query;*/
    searchValue = searchValue.replace(/[;=]/g, '');
    let url = window.location.href;
    let params: String[] = url.split(';');
    if (params.length > 1) {
      // let query: String[] = params[1].split('=');
      let query: String[];
      for (const i of params) {
        query = i.split('=');
        if (query[0] === 'query') {
          query[1] = searchValue;
          params[1] = query.join('=');
          params = params.slice(1);
          url = params.join(';');
          this.searchService.searchParams.next({query: searchValue});
          return window.location.href = '/search;' + url;
        }
      }
      params.splice(1, 0, `query=${searchValue}`);
      params = params.slice(1);
      url = params.join(';');
      this.searchService.searchParams.next({query: searchValue});
      return window.location.href = '/search;' + url;
    } else {
      return this.searchService.search({query: searchValue});
    }
  }

  updateSearchResultsSnippets(searchResults: Paging<Object>) {

    // INITIALISATIONS

    this.errorMessage = null;
    this.searchResults = searchResults;
    this.searchResults.facets.sort();
    if (this.searchResults.results.length === 0) {
      this.foundResults = false;
    } else {
      this.sortFacets.transform(this.searchResults.facets,['Portfolios', 'Users', 'TRL', 'Life Cycle Status'])
    }
    // update form values using URLParameters
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === 'searchFields') {
        this.searchForm.get('searchFields').setValue(urlParameter.values[0]);
      }
      if (urlParameter.key === 'query') {
        this.searchForm.get('query').setValue(urlParameter.values[0]);
      } else if (urlParameter.key === 'advanced') {
        this.advanced = urlParameter.values[0] === 'true';
      } else {
        for (const facet of this.searchResults.facets) {
          if (facet.field === urlParameter.key) {
            //
            for (const parameterValue of urlParameter.values) {
              for (const facetValue of facet.values) {
                if (parameterValue === facetValue.value) {
                  this[facet.field+'Filters'].push(facetValue.value);
                  facetValue.isChecked = true;
                }
              }
            }
          }
        }
      }
    }
    this.updatePagingURLParametersQuantity(this.pageSize);
    this.currentPage = (searchResults.from / this.pageSize) + 1;
    this.totalPages = Math.ceil(searchResults.total / this.pageSize);
  }

  updatePagingURLParametersQuantity(quantity: number) {
    let foundQuantityCategory = false;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === 'quantity') {
        foundQuantityCategory = true;
        urlParameter.values = [];
        urlParameter.values.push(quantity + '');
      }
    }
    if (!foundQuantityCategory) {
      const newQuantityParameter: URLParameter = {
        key: 'quantity',
        values: [quantity + '']
      };
      this.urlParameters.push(newQuantityParameter);
    }
  }

  updatePagingURLParameters(from: number) {
    let foundFromCategory = false;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === 'from') {
        foundFromCategory = true;
        urlParameter.values = [];
        urlParameter.values.push(from + '');
        break;
      }
    }
    if (!foundFromCategory) {
      const newFromParameter: URLParameter = {
        key: 'from',
        values: [from + '']
      };
      this.urlParameters.push(newFromParameter);
    }
  }

  updateSearchField(event) {
    const map: { [name: string]: string; } = {};
    const params = this.route.snapshot.params;
    let found = false;
    this.urlParameters = [];
    for (const i in params) {
      if (params.hasOwnProperty(i)) {
        if (i === 'searchFields') {
          found = true;
          if (event.target.value === '') {
            continue;
          } else {
            this.urlParameters.push({key: i, values: [event.target.value]});
            continue;
          }
        }
        this.urlParameters.push({key: i, values: [params[i]]});
      }
    }
    if (!found) {
      this.urlParameters.push({key: 'searchFields', values: [event.target.value]});
    }
    for (const urlParameter of this.urlParameters) {
      let concatValue = '';
      let counter = 0;
      for (const value of urlParameter.values) {
        if (counter !== 0) {
          concatValue += ',';
        }
        concatValue += value;
        counter++;
      }
      map[urlParameter.key] = concatValue;
    }
    return this.searchService.search(map);
  }

  clearSelections(e, category: string) {
    let categoryIndex = 0;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === category) {
        this.urlParameters.splice(categoryIndex, 1);
      }
      categoryIndex++;
    }
    return this.navigateUsingParameters();
  }

  onSelection(e, category: string, value: string) {
    if (e.target.checked) {
      this.addParameterToURL(category, value);
    } else {
      let categoryIndex = 0;
      for (const urlParameter of this.urlParameters) {
        if (urlParameter.key === category) {
          const valueIndex = urlParameter.values.indexOf(value, 0);
          if (valueIndex > -1) {
            urlParameter.values.splice(valueIndex, 1);
            if (urlParameter.values.length === 0) {
              this.urlParameters.splice(categoryIndex, 1);
            }
          }
        }
        categoryIndex++;
      }
    }
    return this.navigateUsingParameters();
  }

  addParameterToURL(category: string, value: string) {
    let foundCategory = false;
    for (const urlParameter of this.urlParameters) {
      if (urlParameter.key === category) {
        foundCategory = true;
        const valueIndex = urlParameter.values.indexOf(value, 0);
        if (valueIndex < 0) {
          urlParameter.values.push(value);
          this.updatePagingURLParameters(0);
        }
      }
    }
    if (!foundCategory) {
      this.updatePagingURLParameters(0);
      const newParameter: URLParameter = {
        key: category,
        values: [value]
      };
      this.urlParameters.push(newParameter);
    }
  }

  navigateUsingParameters() {
    const map: { [name: string]: string; } = {};
    for (const urlParameter of this.urlParameters) {
      map[urlParameter.key] = urlParameter.values.join(',');
    }
    // console.log(map);
    return this.router.navigate(['/search', map]);
  }

  paginationInit() {
    let addToEndCounter = 0;
    let addToStartCounter = 0;
    this.pages = [];
    this.currentPage = (this.searchResults.from / this.pageSize) + 1;
    this.pageTotal = Math.ceil(this.searchResults.total / this.pageSize);
    for ( let i = (+this.currentPage - this.offset); i < (+this.currentPage + 1 + this.offset); ++i ) {
      if ( i < 1 ) { addToEndCounter++; }
      if ( i > this.pageTotal ) { addToStartCounter++; }
      if ((i >= 1) && (i <= this.pageTotal)) {
        this.pages.push(i);
      }
    }
    for ( let i = 0; i < addToEndCounter; ++i ) {
      if (this.pages.length < this.pageTotal) {
        this.pages.push(this.pages.length + 1);
      }
    }
    for ( let i = 0; i < addToStartCounter; ++i ) {
      if (this.pages[0] > 1) {
        this.pages.unshift(this.pages[0] - 1 );
      }
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    let from: number = (this.currentPage - 1) * this.pageSize
    this.updatePagingURLParameters(from);
    return this.navigateUsingParameters();
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      let from: number = this.searchResults.from;
      from -= this.pageSize;
      this.updatePagingURLParameters(from);
      this.navigateUsingParameters();
    }
  }

  nextPage() {
    if (this.currentPage < this.pageTotal) {
      this.currentPage++;
      let from: number = this.searchResults.from;
      from += this.pageSize;
      this.updatePagingURLParameters(from);
      this.navigateUsingParameters();
    }
  }

  showFiltersMobile(show: boolean) {
    this.filtersMobileShown = show;
  }

}
