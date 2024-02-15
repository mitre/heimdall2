<template>
    <Modal
     :visible="visible"
     retain-focus :persistent="true"
     :fullscreen="fullscreen"
     @close-modal="$emit('close-modal')">
        <v-card>
            <v-card-title>Select Usage</v-card-title>

            <v-divider />
            <v-overlay
            :opacity="1"
            :value="loading"
            >
            <v-progress-circular indeterminate size="64">
                    Loading...
            </v-progress-circular>
            </v-overlay>

            <v-col>
                <h3>Select the Usage of Heimdall for your session</h3>
                <br />
                <v-radio-group v-model="viewModeType">
                    <v-radio label="Certifier" value="0"/>
                    <v-radio label="Developer" value="1" />
                    <v-radio label="Cyber" value="2" />
                </v-radio-group>
                <h4>You can switch anytime in the future</h4>
                <br />
            </v-col>

            <v-col v-if="!isProductSelected">
                <v-card-title>Select a Software Product</v-card-title>
                <ProductLoadFileList
                    :headers="headersProduct"
                    :files="itemsProduct"
                    :loading="loadingProduct"
                    @load-results="load_results_product($event)"
                />
            </v-col>

            <v-col v-if="isProductSelected">
                <v-card-title>Select a Software Build</v-card-title>
                <v-btn depressed elevation="2" @click=switch_product()  raised>Switch Product</v-btn>
                <BuildLoadFileList
                    :headers="headers"
                    :files="itemsBuild"
                    :loading="loadingBuild"
                    @load-results="load_results($event)"
                />
            </v-col>
        </v-card>
        <v-card-actions>
        <v-btn
            color= "primary"
            text @click="$emit('close-modal')"
            style="width: 100%"
        >
            <span class="d-md-inline" style="display: inline !important;"> Close Window </span>
        </v-btn>
      </v-card-actions>
    </Modal>
</template>

<script lang="ts">
import Modal from '@/components/global/Modal.vue';
import Vuex from 'vue';
import Component from 'vue-class-component';
import {Prop, Watch} from 'vue-property-decorator';
import {FilteredDataModule} from '../../store/data_filters';
import {ProductModuleState} from '../../store/product_module_state';
import {ViewModeType} from '@/enums/product_model_view_mode';
import BuildLoadFileList from '@/components/global/upload_tabs/BuildLoadFileList.vue';
import ProductLoadFileList from '@/components/global/upload_tabs/ProductLoadFileList.vue';
import {BuildModule} from '@/store/builds';
import {ProductModule} from '@/store/products';
import {IBuild} from '@heimdall/interfaces';
import {IProduct} from '@heimdall/interfaces';
import {LocalStorageVal} from '@/utilities/helper_util';
import RefreshButton from '@/components/generic/RefreshButton.vue';
const localTab = new LocalStorageVal<string>('nexus_curr_tab');
@Component({
    components: {
        Modal,
        BuildLoadFileList,
        ProductLoadFileList,
        RefreshButton
    }
})

export default class ProjectModal extends Vuex {
    @Prop({default: false}) readonly refresh!: boolean;
    activeTab: string = localTab.getDefault('uploadtab-local');

    get fullscreen() {
      return (
        this.activeTab === 'uploadtab-database' || this.$vuetify.breakpoint.mobile
      );
    }

    loading: boolean = false;
    viewModeType = "1"
    selectedProductID: string = "";

    headers: Object[] = [
        {
            text: 'Build ID',
            align: 'start',
            sortable: true,
            value: 'id'
        },
        {
            text: 'Branch Name',
            sortable: true,
            value: 'branchName'
        },
        {text: 'Uploaded', value: 'createdAt', sortable: true},
    ];

    headersProduct: Object[] = [
        {
            text: 'Product ID',
            align: 'start',
            sortable: true,
            value: 'id'
        },
        {
            text: 'Product Name',
            sortable: true,
            value: 'productName'
        },
        {text: 'Uploaded', value: 'createdAt', sortable: true},
    ];

    // Old method displaying all builds in database, use new product selected methods below
    async get_all_build_results(): Promise<void> {
        BuildModule.getAllBuilds();
    }

    async get_all_product_results(): Promise<void> {
        ProductModule.getAllProducts();
    }

    async get_selected_product_build_results(productID: string): Promise<void> {
        ProductModule.getSelectedProductBuilds(productID);
    }

    get loadingBuild() {
        return ProductModule.loading
    }

    get loadingProduct() {
        return ProductModule.loading;
    }

    get itemsBuild() {
        return ProductModule.selectedBuilds;
    }

    get itemsProduct() {
        return ProductModule.allProducts;
    }

    get isProductSelected() {
        return this.selectedProductID !== "";
    }

    switch_product(){
        this.selectedProductID = "";
    }

    load_results(builds: IBuild[]): void {
        // Only load first selection
        if (builds.length > 0) {
            this.loadBuild(builds[0].id, builds[0].buildId)
        }
    }

    load_results_product(products: IProduct[]): void {
        // Only load first selection
        if (products.length > 0) {
            this.loadProduct(products[0].id, products[0].objectStoreKey)
        }
    }

    mounted(){
        this.get_all_product_results();
    }

    @Prop({default: true}) readonly visible!: boolean;

    loadBuild(buildDatabaseId: string, buildId: string) {
        let viewMode: number = +this.viewModeType

        if (viewMode == ViewModeType.Certifier) {
            this.$router.push('/certifier').catch(() => {
                // Ignore errors caused by navigation
            });
        } else if (viewMode == ViewModeType.Developer) {
            this.$router.push( '/developer').catch(() => {
                // Ignore errors caused by navigation
            });
        } else if (viewMode == ViewModeType.Cyber) {
            this.$router.push('/cyber').catch(() => {
                // Ignore errors caused by navigation
            });
        } else {
            // Invalid view mode selected for loading, aborting
            return
        }

        //this.loading=true;
        FilteredDataModule.CLEAR_ALL_EVALUATIONS();
        ProductModuleState.UpdateViewMode(viewMode);
        ProductModuleState.UpdateViewBuildId(buildId);
        ProductModuleState.LoadBuild(buildDatabaseId);
    }


    loadProduct(productID: string, objectStoreKey: string) {
        FilteredDataModule.CLEAR_ALL_EVALUATIONS();
        this.selectedProductID = productID;
        ProductModuleState.UpdateViewObjectStoreKey(objectStoreKey);
        this.get_selected_product_build_results(productID);
    }
}
</script>

<!-- Highlight_feature -->
<!-- <style scoped>
/* add condition to only show visible when product is already selected */
.v-btn {
    background-color: #3b3640;
    color: #5d5c5cc9;
    font-weight: bold;
    border-radius: 10%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.907);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;

}
</style> -->
